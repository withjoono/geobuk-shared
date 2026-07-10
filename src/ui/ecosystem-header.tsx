import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { UtilityNav, type UtilityNavProps } from './utility-nav.js';

/**
 * 2단 생태계 헤더 (거북스쿨 위성앱 공용) — 유연한 shell.
 *
 *  ┌───────────────────────────────────────────────┐
 *  │ [⊞ T스쿨]                       < UtilityNav > │  ← 윗줄: 생태계/유틸 (공통 · shell 제공)
 *  ├───────────────────────────────────────────────┤
 *  │  (앱이 기존 헤더 콘텐츠를 children 으로 그대로) │  ← 아랫줄: 앱 고유 (로고·네비·모바일메뉴 등)
 *  └───────────────────────────────────────────────┘
 *
 * 표준화 지점은 "윗줄"뿐: T스쿨 이동 + 기존 `UtilityNav` 재사용. 아랫줄은 `children`(앱 소유).
 *
 * ⚠️ 배경/테두리/그림자는 Tailwind 클래스가 아니라 **인라인 스타일**로 지정한다.
 *    (라이브러리는 컴파일된 dist 로 배포되는데, 소비 앱의 tailwind content 설정에 따라
 *     dist 안에서만 쓰인 유틸 클래스가 purge 되어 색이 안 먹는 경우가 있어 이를 방지)
 */
export interface EcosystemHeaderProps {
  /** T스쿨 메인 URL. 기본 https://www.tskool.kr */
  hubUrl?: string;
  /** 좌상단 라벨. 기본 'T스쿨' */
  hubLabel?: string;
  /** 윗줄 오른쪽 유틸 묶음(UtilityNav)으로 그대로 전달 */
  utility: UtilityNavProps;
  /** 아랫줄: 앱 고유 헤더 콘텐츠(로고/네비/모바일메뉴 등)를 그대로 주입 */
  children: React.ReactNode;
}

export function EcosystemHeader({
  hubUrl = 'https://www.tskool.kr',
  hubLabel = 'T스쿨',
  utility,
  children,
}: EcosystemHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
    >
      {/* 윗줄: 생태계 바 — 회색 밴드(인라인) */}
      <div
        className="flex items-center gap-2 px-4 text-xs"
        style={{
          background: '#e8ebf0',
          borderBottom: '1px solid #d6dbe3',
          paddingTop: '3px',
          paddingBottom: '3px',
        }}
      >
        <a
          href={hubUrl}
          className="flex items-center gap-1"
          style={{ fontSize: 11, fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}
          title="T스쿨 메인으로"
        >
          <LayoutGrid style={{ width: 16, height: 16 }} strokeWidth={1.5} />
          <span>{hubLabel}</span>
        </a>
        <div className="flex-1" />
        <UtilityNav {...utility} compact />
      </div>

      {/* 아랫줄: 앱 고유 헤더 (앱이 주입) */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        {children}
      </div>
    </header>
  );
}
