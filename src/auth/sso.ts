/**
 * geobuk-shared/auth - SSO Helper
 *
 * Hub 허브에서 SSO 코드를 생성하고, 그것을 받은 앱에서 처리하는 헬퍼입니다.
 * 환경변수를 직접 참조하지 않고 설정값을 주입(inject)받습니다.
 *
 * [SSO 흐름]
 * 1. Hub → generateSSOUrl()로 Hub Backend에 일회용 코드 요청 → 코드가 포함된 URL 반환
 * 2. 외부 앱(ExamHub 등) → processSSOCode()로 URL의 코드를 자신의 Backend에 보내 토큰 교환
 */

import { AxiosInstance } from 'axios';
import { setTokens } from './token-manager.js';

// --- Part 1: Hub에서 SSO URL 생성 (허브용) ---

export interface SSOGeneratorConfig {
  /** Hub의 인증된 API 클라이언트 (authClient) */
  hubAuthClient: AxiosInstance;
  /** 2015 교육과정 사용자가 생기북 접근 시 대신 보낼 URL (optional) */
  susiUrl?: string;
}

/**
 * Hub Backend에 SSO 일회용 코드를 요청하고, 코드가 포함된 URL을 반환합니다.
 * Hub-Frontend의 헤더나 서비스 링크에서 호출합니다.
 */
export async function generateSSOUrl(
  apiClient: AxiosInstance,
  baseUrl: string,
  targetService: string = 'susi',
  susiUrl?: string,
): Promise<string> {
  // 2015 교육과정 사용자 → 생기북 대신 수시앱으로 리다이렉트
  if (targetService === 'mysanggibu' && susiUrl && _is2015CurriculumUser()) {
    targetService = 'susi';
    baseUrl = susiUrl;
  }

  try {
    const response = await apiClient.post('/auth/sso/generate-code', { targetService });
    const { code } = response.data?.data || response.data;
    const url = new URL(baseUrl);
    url.searchParams.set('sso_code', code);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function _is2015CurriculumUser(): boolean {
  try {
    const stored = localStorage.getItem('user-storage');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    const memberId =
      parsed?.state?.userInfo?.memberId ||
      parsed?.state?.userInfo?.member_id;
    if (!memberId || typeof memberId !== 'string') return false;
    const match = memberId.match(/^S(\d{2}H)(\d{3})/);
    if (!match) return false;
    return ['003', '004', '000'].includes(match[2]);
  } catch {
    return false;
  }
}

// --- Part 2: 외부 앱에서 SSO 코드 처리 (Susi, ExamHub 등) ---

export interface SSOProcessorConfig {
  /** 각 앱 자신의 Backend URL (e.g. process.env.NEXT_PUBLIC_API_URL) */
  apiUrl: string;
}

/**
 * URL에서 SSO 코드를 추출하여 자신의 Backend에 토큰 교환을 요청합니다.
 * Susi, ExamHub 등 외부 앱의 SSO Listener 컴포넌트에서 호출합니다.
 *
 * @returns 로그인 성공 여부
 */
export async function processSSOCode(config: SSOProcessorConfig): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const ssoCode = params.get('sso_code');
  if (!ssoCode) return false;

  try {
    const response = await fetch(`${config.apiUrl}/auth/sso/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ssoCode }),
      credentials: 'include',
    });

    const result = await response.json();
    const tokenData = result.data || result;

    if (!response.ok || !result.success || !tokenData.accessToken) {
      _cleanupSSOCode();
      return false;
    }

    setTokens(tokenData.accessToken, tokenData.refreshToken);
    _cleanupSSOCode();
    return true;
  } catch {
    _cleanupSSOCode();
    return false;
  }
}

/**
 * URL에서 sso_code 파라미터를 제거합니다 (보안: 브라우저 히스토리에 코드 남기지 않음)
 */
function _cleanupSSOCode(): void {
  const params = new URLSearchParams(window.location.search);
  params.delete('sso_code');
  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

/**
 * URL에 SSO 코드가 포함되어 있는지 확인
 */
export function hasSSOCode(): boolean {
  return new URLSearchParams(window.location.search).has('sso_code');
}
