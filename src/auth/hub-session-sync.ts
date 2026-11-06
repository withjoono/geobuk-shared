/**
 * geobuk-shared/auth - 허브 세션 동기화 (A안: 허브 로그인이 유일한 기준)
 *
 * 문제: 위성앱은 처음 SSO 때 받은 토큰을 자기 도메인 localStorage 에 넣고 다시는 허브에 묻지 않는다.
 *       그래서 허브(또는 다른 위성앱을 거쳐 허브)에서 계정을 바꿔도 이 앱은 예전 계정을 계속 쓴다.
 *       (2026-11-06 시뮬레이션: T스쿨=28학생1, T플래너=경쟁테스트01)
 *
 * 해법: 앱을 열 때와 탭이 다시 보일 때 허브에 "지금 누구로 로그인돼 있나"를 조용히 묻는다.
 *
 *   1) 숨은 iframe — `${hubUrl}/auth/session-check?mode=iframe`
 *      허브가 자기 도메인 쿠키(ts_hub_session, SameSite=None)에 적어 둔 memberId 와 비교해
 *      same / different / none / unknown 을 postMessage 로 돌려준다. 깜빡임 없음.
 *      허브 세션 본체는 localStorage 인데, 다른 사이트 안의 iframe 에서는 localStorage 가
 *      분리(partition)돼 보이지 않는다. 그래서 허브가 memberId 만 쿠키에 따로 적어 둔다(토큰은 적지 않는다).
 *   2) 최상위 리다이렉트 — `${hubUrl}/auth/session-check?mode=redirect`
 *      iframe 이 unknown 을 돌려주거나(사파리·파이어폭스처럼 서드파티 쿠키를 막는 브라우저)
 *      계정이 다르다고 나왔을 때 쓴다. 허브 페이지는 최상위라 자기 localStorage 를 그대로 읽고,
 *      다르면 새 sso_code 를 붙여 돌려보낸다 → 각 앱이 이미 갖고 있는 루트 SSO 처리 로직이 교환한다.
 *
 * 그래서 이 모듈은 앱마다 다른 토큰 교환 방식(자체 백엔드 /auth/sso/exchange, 프론트 직접 verify-code)을
 * 몰라도 된다. 교환은 언제나 "URL 의 ?sso_code=" 를 처리하는 기존 코드가 맡는다.
 *
 * 프로토콜 상수는 Hub-Frontend/src/lib/hub-session/protocol.ts 와 반드시 같아야 한다.
 */

import { clearTokens, getAccessToken, getRefreshToken } from './token-manager.js';

// ── 프로토콜 (Hub-Frontend/src/lib/hub-session/protocol.ts 와 동일하게 유지) ──
// firebase.json 이 cleanUrls 라 .html 없이 연다(.html 로 열면 301 이 한 번 더 생긴다).
export const HUB_SESSION_CHECK_PATH = '/auth/session-check';
export const HUB_SESSION_MESSAGE_TYPE = 'geobuk-hub-session';
/** 리다이렉트 결과는 해시로 돌아온다(서버 로그·Referer 에 남지 않고, 앱의 sso_code 정리 로직과도 안 겹친다). */
export const HUB_SESSION_HASH_KEY = 'hub_session';
export const HUB_SESSION_HASH_NICK = 'hub_nick';
/** 허브 링크에 붙여 "허브 계정이 이 앱과 다르면 경고"하게 하는 파라미터 */
export const HUB_EXPECT_MEMBER_PARAM = 'expect_member';

export type HubSessionStatus = 'same' | 'different' | 'none' | 'unknown';

const LS_PREFIX = 'geobuk-hub-sync:';
const LS_LAST_CHECK = `${LS_PREFIX}last-check`;
const LS_LAST_REDIRECT = `${LS_PREFIX}last-redirect`;
const LS_IMPERSONATING = `${LS_PREFIX}impersonating`;
const SS_PENDING = `${LS_PREFIX}pending`;
const SS_NOTICE = `${LS_PREFIX}notice`;

export interface HubSessionSyncOptions {
  /** 허브 프런트 주소. 예: https://www.tskool.kr (거북스쿨 계열 앱은 https://www.geobukschool.kr) */
  hubUrl: string;
  /** 탭 복귀가 잦아도 이 간격에 한 번만 확인한다. 기본 30초 */
  minIntervalMs?: number;
  /**
   * iframe 으로 확인이 안 되는 브라우저(사파리 등)에서 최상위 리다이렉트로 확인하는 최소 간격.
   * 리다이렉트는 페이지를 한 번 다시 여는 것이라, 계정이 같아도 잠깐 깜빡인다. 기본 10분.
   * 0 이면 리다이렉트 대체를 끈다(사파리에서는 계정 전환을 못 따라간다).
   */
  fallbackIntervalMs?: number;
  /** iframe 응답 대기 시간. 기본 4초 */
  iframeTimeoutMs?: number;
  /** 지금 화면에 저장 안 한 입력이 있는지. 있으면 전환 전에 확인을 받는다. 기본: markHubSyncDirty 레지스트리 */
  isDirty?: () => boolean;
  /** 앱 고유 로그인 상태(zustand persist 등)를 함께 지운다. 토큰(accessToken/refreshToken)은 이 모듈이 지운다. */
  onClearAuth?: () => void;
  /** 허브가 로그아웃 상태라서 이 앱도 로그아웃했을 때 */
  onLoggedOut?: () => void;
  /** 전환 안내를 직접 띄우고 싶을 때(토스트 등). 없으면 상단에 기본 안내 바를 띄운다. */
  onSwitched?: (info: { nickname: string | null; message: string }) => void;
  /** 안내 문구를 바꾼다. 예: 학부모·선생님이 viewAs 로 보는 중일 때 */
  formatSwitchMessage?: (nickname: string | null) => string;
  /** 디버그 로그 */
  debug?: boolean;
}

// ─────────────────────────────── 유틸 ───────────────────────────────

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    /* 사생활 보호 모드 등 */
  }
}
function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* noop */
  }
}

const stripWww = (origin: string) => origin.replace(/^(https?:\/\/)www\./i, '$1');

/** Hub JWT(HS512)의 payload 를 서명 검증 없이 읽는다. 표시·비교용이지 인증 판단용이 아니다. */
export function decodeJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** 이 앱 토큰의 Hub memberId(= JWT jti). 토큰이 없으면 null */
export function getTokenMemberId(): string | null {
  if (typeof window === 'undefined') return null; // SSR·정적 export 빌드 중
  const payload = decodeJwtPayload(getRefreshToken()) || decodeJwtPayload(getAccessToken());
  const jti = payload?.jti;
  return typeof jti === 'string' && jti ? jti : null;
}

/**
 * 허브를 여는 링크(계정 공유·설정·결제 등)에 현재 앱 계정을 붙인다.
 * 허브는 자기 계정이 다르면 "이 앱과 다른 계정으로 로그인돼 있어요" 경고를 띄운다.
 */
export function withHubMemberHint(url: string): string {
  if (typeof window === 'undefined') return url;
  const memberId = getTokenMemberId();
  if (!memberId) return url;
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set(HUB_EXPECT_MEMBER_PARAM, memberId);
    return u.toString();
  } catch {
    return url;
  }
}

// ─────────────────────── 저장 안 한 입력 레지스트리 ───────────────────────

const dirtySources = new Set<string>();

/** 폼이 수정되면 true, 저장·취소되면 false 로 알린다. 계정 전환 전에 확인 창을 띄우는 근거가 된다. */
export function markHubSyncDirty(source: string, dirty: boolean): void {
  if (dirty) dirtySources.add(source);
  else dirtySources.delete(source);
}

export function hasHubSyncDirty(): boolean {
  return dirtySources.size > 0;
}

// ─────────────────────────────── 안내 바 ───────────────────────────────

export function showHubSessionNotice(message: string, durationMs = 4000): void {
  if (typeof document === 'undefined') return;
  const render = () => {
    const prev = document.getElementById('geobuk-hub-session-notice');
    prev?.remove();
    const bar = document.createElement('div');
    bar.id = 'geobuk-hub-session-notice';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.textContent = message;
    Object.assign(bar.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '2147483000',
      maxWidth: 'calc(100vw - 32px)',
      padding: '10px 16px',
      borderRadius: '10px',
      background: '#111827',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '1.4',
      boxShadow: '0 6px 20px rgba(0,0,0,.18)',
      cursor: 'pointer',
      transition: 'opacity .3s',
    } as Partial<CSSStyleDeclaration>);
    bar.addEventListener('click', () => bar.remove());
    document.body.appendChild(bar);
    window.setTimeout(() => {
      bar.style.opacity = '0';
      window.setTimeout(() => bar.remove(), 350);
    }, durationMs);
  };
  if (document.body) render();
  else window.addEventListener('DOMContentLoaded', render, { once: true });
}

const defaultSwitchMessage = (nickname: string | null) =>
  nickname ? `${nickname} 계정으로 전환됐어요` : '다른 계정으로 전환됐어요';

// ─────────────────────────────── 본체 ───────────────────────────────

interface Ctx {
  opts: Required<Pick<HubSessionSyncOptions, 'minIntervalMs' | 'fallbackIntervalMs' | 'iframeTimeoutMs'>> &
    HubSessionSyncOptions;
  hubOrigin: string;
  inFlight: boolean;
  stopped: boolean;
}

function log(ctx: Ctx, ...args: unknown[]) {
  if (ctx.opts.debug) console.warn('[hub-session-sync]', ...args);
}

function checkUrl(ctx: Ctx, mode: 'iframe' | 'redirect', extra: Record<string, string>): string {
  const u = new URL(HUB_SESSION_CHECK_PATH, ctx.opts.hubUrl);
  u.searchParams.set('mode', mode);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}

/** 리다이렉트에서 돌아온 결과(해시)를 읽고 지운다. 렌더 전에 한 번만 호출된다. */
function consumeReturnHash(): { status: string | null; nickname: string | null } {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.includes(`${HUB_SESSION_HASH_KEY}=`)) return { status: null, nickname: null };
  const params = new URLSearchParams(hash);
  const status = params.get(HUB_SESSION_HASH_KEY);
  const nickname = params.get(HUB_SESSION_HASH_NICK);
  params.delete(HUB_SESSION_HASH_KEY);
  params.delete(HUB_SESSION_HASH_NICK);
  const rest = params.toString();
  const url = window.location.pathname + window.location.search + (rest ? `#${rest}` : '');
  window.history.replaceState(window.history.state, '', url);
  return { status, nickname };
}

/** 대리 접속(선생님이 학생 계정으로 들어온 SSO_IMP_ 코드) 중에는 허브 계정과 다른 게 정상이다 → 동기화하지 않는다. */
function trackImpersonation(): void {
  const code = new URLSearchParams(window.location.search).get('sso_code');
  if (!code) return;
  if (code.startsWith('SSO_IMP_')) safeSet(localStorage, LS_IMPERSONATING, '1');
  else safeRemove(localStorage, LS_IMPERSONATING);
}

function logoutHere(ctx: Ctx) {
  clearTokens();
  try {
    ctx.opts.onClearAuth?.();
  } catch {
    /* noop */
  }
}

function askIframe(ctx: Ctx, current: string): Promise<HubSessionStatus> {
  return new Promise((resolve) => {
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.title = 'hub-session-check';
    Object.assign(iframe.style, {
      position: 'absolute',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    });
    let done = false;
    const finish = (status: HubSessionStatus) => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
      iframe.remove();
      resolve(status);
    };
    const onMessage = (event: MessageEvent) => {
      // apex(tskool.kr)로 열어도 허브가 www 로 넘기므로 www 유무는 같은 허브로 본다.
      if (stripWww(event.origin) !== stripWww(ctx.hubOrigin)) return;
      const data = event.data as { type?: string; nonce?: string; status?: HubSessionStatus } | null;
      if (!data || data.type !== HUB_SESSION_MESSAGE_TYPE || data.nonce !== nonce) return;
      finish(data.status ?? 'unknown');
    };
    const timer = window.setTimeout(() => finish('unknown'), ctx.opts.iframeTimeoutMs);
    window.addEventListener('message', onMessage);
    iframe.src = checkUrl(ctx, 'iframe', {
      origin: window.location.origin,
      current,
      nonce,
    });
    document.body.appendChild(iframe);
  });
}

function redirectToHub(ctx: Ctx, current: string) {
  safeSet(localStorage, LS_LAST_REDIRECT, String(Date.now()));
  safeSet(sessionStorage, SS_PENDING, current);
  // 현재 주소에서 혹시 남아 있는 sso_code 는 빼고 보낸다(돌아올 때 새 코드가 붙는다).
  const back = new URL(window.location.href);
  back.searchParams.delete('sso_code');
  back.hash = '';
  window.location.replace(checkUrl(ctx, 'redirect', { redirect: back.toString(), current }));
}

function confirmSwitch(ctx: Ctx): boolean {
  const dirty = ctx.opts.isDirty ? ctx.opts.isDirty() : hasHubSyncDirty();
  if (!dirty) return true;
  return window.confirm('다른 계정으로 바뀌었어요. 저장하지 않은 내용은 사라져요.\n지금 바뀐 계정으로 전환할까요?');
}

async function runCheck(ctx: Ctx, reason: string): Promise<void> {
  if (ctx.stopped || ctx.inFlight) return;
  if (safeGet(localStorage, LS_IMPERSONATING) === '1') return;
  // SSO 교환이 진행 중인 화면에서는 건드리지 않는다.
  if (new URLSearchParams(window.location.search).has('sso_code')) return;

  const current = getTokenMemberId();
  if (!current) return; // 이 앱이 로그인 안 된 상태면 동기화할 것이 없다(자동 로그인은 기존 흐름이 맡는다).

  const now = Date.now();
  const last = Number(safeGet(localStorage, LS_LAST_CHECK) || 0);
  if (now - last < ctx.opts.minIntervalMs) return;
  safeSet(localStorage, LS_LAST_CHECK, String(now));

  ctx.inFlight = true;
  try {
    const status = await askIframe(ctx, current);
    log(ctx, reason, '→', status);
    if (ctx.stopped) return;
    // 기다리는 사이 다른 탭이 이미 이 앱을 전환했을 수 있다.
    if (getTokenMemberId() !== current) return;

    if (status === 'same') return;

    if (status === 'none') {
      logoutHere(ctx);
      ctx.opts.onLoggedOut?.();
      if (!ctx.opts.onLoggedOut) window.location.reload();
      return;
    }

    if (status === 'different') {
      // 허브가 코드 발급에 실패했을 때 탭 복귀마다 리다이렉트가 반복되지 않도록 1분은 쉰다.
      const lastRedirect = Number(safeGet(localStorage, LS_LAST_REDIRECT) || 0);
      if (now - lastRedirect < 60_000) return;
      if (!confirmSwitch(ctx)) return;
      redirectToHub(ctx, current);
      return;
    }

    // unknown — 서드파티 쿠키가 막힌 브라우저. 최상위 리다이렉트로 확인한다(간격 제한).
    if (ctx.opts.fallbackIntervalMs <= 0) return;
    const lastRedirect = Number(safeGet(localStorage, LS_LAST_REDIRECT) || 0);
    if (now - lastRedirect < ctx.opts.fallbackIntervalMs) return;
    // 입력 중인 화면을 계정이 같은지도 모르는 채로 새로 고치지 않는다.
    if (ctx.opts.isDirty ? ctx.opts.isDirty() : hasHubSyncDirty()) return;
    redirectToHub(ctx, current);
  } finally {
    ctx.inFlight = false;
  }
}

function handleReturn(ctx: Ctx, ret: { status: string | null; nickname: string | null }) {
  if (!ret.status) return;
  const pendingFrom = safeGet(sessionStorage, SS_PENDING);
  safeRemove(sessionStorage, SS_PENDING);
  safeSet(localStorage, LS_LAST_CHECK, String(Date.now()));

  // forbidden = 허브 계정이 이 앱을 쓸 수 없는 계정(예: 학생 전용 앱에 선생님 계정) → 예전 계정으로 남지 않게 로그아웃
  if (ret.status === 'none' || ret.status === 'forbidden') {
    logoutHere(ctx);
    ctx.opts.onLoggedOut?.();
    if (!ctx.opts.onLoggedOut) window.location.reload();
    return;
  }
  if (ret.status === 'switched') {
    // 예전 계정 토큰을 지운다. 새 토큰은 이 페이지 URL 의 sso_code 를 앱의 기존 SSO 로직이 교환해 넣는다.
    if (pendingFrom && getTokenMemberId() === pendingFrom) logoutHere(ctx);
    const message = (ctx.opts.formatSwitchMessage ?? defaultSwitchMessage)(ret.nickname);
    safeSet(
      sessionStorage,
      SS_NOTICE,
      JSON.stringify({ nickname: ret.nickname, message, at: Date.now() }),
    );
  }
  // same / error 는 아무것도 하지 않는다(error 는 1분 뒤 다시 시도된다).
}

/**
 * 전환 안내는 앱이 sso_code 교환을 마친 뒤(주소에서 sso_code 가 사라진 뒤) 띄운다.
 * 교환 뒤 페이지를 새로 고치는 앱(T모고 등)도 있어서, 안내를 sessionStorage 에 두었다가
 * 새 페이지에서 이어서 띄운다. 30초가 지난 안내는 버린다.
 */
function flushPendingNotice(ctx: Ctx): void {
  const raw = safeGet(sessionStorage, SS_NOTICE);
  if (!raw) return;
  let pending: { nickname: string | null; message: string; at: number };
  try {
    pending = JSON.parse(raw);
  } catch {
    safeRemove(sessionStorage, SS_NOTICE);
    return;
  }
  if (Date.now() - pending.at > 30_000) {
    safeRemove(sessionStorage, SS_NOTICE);
    return;
  }
  let tries = 0;
  const tick = () => {
    if (ctx.stopped) return;
    if (new URLSearchParams(window.location.search).has('sso_code') && tries++ < 50) {
      window.setTimeout(tick, 200);
      return;
    }
    if (safeGet(sessionStorage, SS_NOTICE) !== raw) return; // 다른 곳에서 이미 띄움
    safeRemove(sessionStorage, SS_NOTICE);
    if (ctx.opts.onSwitched) ctx.opts.onSwitched({ nickname: pending.nickname, message: pending.message });
    else showHubSessionNotice(pending.message);
  };
  // 앱이 토스트 컨테이너를 마운트할 시간을 준다.
  window.setTimeout(tick, 300);
}

/**
 * 허브 세션 동기화를 시작한다. 반환값을 호출하면 멈춘다.
 * React 앱은 useHubSessionSync 를 쓰고, 그 밖(Next 클라이언트 컴포넌트의 useEffect 등)에서는 이것을 직접 부른다.
 */
export function startHubSessionSync(options: HubSessionSyncOptions): () => void {
  if (typeof window === 'undefined') return () => {};
  let hubOrigin: string;
  try {
    hubOrigin = new URL(options.hubUrl).origin;
  } catch {
    console.error('[hub-session-sync] hubUrl 이 올바르지 않습니다:', options.hubUrl);
    return () => {};
  }
  // 허브 자신에서는 돌지 않는다.
  if (hubOrigin === window.location.origin) return () => {};

  const ctx: Ctx = {
    opts: {
      minIntervalMs: 30_000,
      fallbackIntervalMs: 10 * 60_000,
      iframeTimeoutMs: 4_000,
      ...options,
    },
    hubOrigin,
    inFlight: false,
    stopped: false,
  };

  trackImpersonation();
  const returned = consumeReturnHash();
  handleReturn(ctx, returned);
  flushPendingNotice(ctx);

  const onVisible = () => {
    if (document.visibilityState === 'visible') void runCheck(ctx, 'visible');
  };
  const onFocus = () => void runCheck(ctx, 'focus');
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onFocus);
  // 방금 허브에서 확인받고 돌아온 길이면 다시 묻지 않는다(리다이렉트 반복 방지).
  if (!returned.status) void runCheck(ctx, 'start');

  return () => {
    ctx.stopped = true;
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onFocus);
  };
}
