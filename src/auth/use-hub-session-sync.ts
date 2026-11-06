/**
 * geobuk-shared/auth - useHubSessionSync
 *
 * 각 위성앱은 루트 레이아웃(모든 경로에서 마운트되는 곳)에서 이 훅 한 줄만 부르면 된다.
 *
 *   useHubSessionSync({ hubUrl: import.meta.env.VITE_HUB_URL, onClearAuth: clearAuth });
 *
 * 앱 시작·탭 복귀(visibilitychange·focus) 때 허브 계정을 확인하고(30초에 한 번),
 * 다르면 예전 토큰을 버리고 허브 계정으로 다시 SSO 한다. 자세한 동작은 hub-session-sync.ts 참고.
 */
import { useEffect, useRef } from 'react';
import {
  markHubSyncDirty as _mark,
  startHubSessionSync,
  type HubSessionSyncOptions,
} from './hub-session-sync.js';

export function useHubSessionSync(options: HubSessionSyncOptions): void {
  // 콜백이 렌더마다 바뀌어도 동기화를 다시 시작하지 않도록 최신 값만 참조한다.
  const ref = useRef(options);
  ref.current = options;

  useEffect(() => {
    if (!options.hubUrl) return;
    const latest = ref.current;
    return startHubSessionSync({
      ...latest,
      isDirty: latest.isDirty ? () => ref.current.isDirty?.() ?? false : undefined,
      onClearAuth: () => ref.current.onClearAuth?.(),
      onLoggedOut: latest.onLoggedOut ? () => ref.current.onLoggedOut?.() : undefined,
      onSwitched: latest.onSwitched ? (info) => ref.current.onSwitched?.(info) : undefined,
      formatSwitchMessage: latest.formatSwitchMessage
        ? (nick) => (ref.current.formatSwitchMessage ?? latest.formatSwitchMessage)!(nick)
        : undefined,
    });
    // hubUrl 이 바뀔 때만 다시 시작한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.hubUrl]);
}

/** 폼 컴포넌트에서: useHubSyncDirtyGuard('plan-form', isDirty) — 저장 안 한 입력이 있으면 전환 전에 확인을 받는다. */
export function useHubSyncDirtyGuard(source: string, dirty: boolean): void {
  useEffect(() => {
    _mark(source, dirty);
    return () => _mark(source, false);
  }, [source, dirty]);
}
