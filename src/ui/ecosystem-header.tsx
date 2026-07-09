import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { UtilityNav, type UtilityNavProps } from './utility-nav.js';

/**
 * 2단 생태계 헤더 (거북스쿨 위성앱 공용) — 유연한 shell.
 *
 *  ┌───────────────────────────────────────────────┐
 *  │ [⊞ T스쿨]                       < UtilityNav > │  ← 윗줄: 생태계/유틸 (모든 앱 공통 · shell 제공)
 *  ├───────────────────────────────────────────────┤
 *  │  (앱이 기존 헤더 콘텐츠를 children 으로 그대로) │  ← 아랫줄: 앱 고유 (로고·네비·모바일메뉴 등)
 *  └───────────────────────────────────────────────┘
 *
 * 표준화 지점은 "윗줄"뿐: T스쿨 이동 + 기존 `UtilityNav`(도토리/결제/알림/계정/유저) 재사용.
 * 아랫줄은 앱마다 헤더가 제각각(드롭다운·모바일 Sheet 등)이라 `children` 으로 그대로 감싼다.
 * → 마이그레이션: 앱의 기존 `<header>` 를 이 컴포넌트로 감싸고, 그 안에서 UtilityNav 만 utility 로 끌어올린다.
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
    <header className="sticky top-0 z-40 w-full bg-white">
      {/* 윗줄: 생태계 바 (T스쿨 이동 + UtilityNav) */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1 text-xs">
        <a
          href={hubUrl}
          className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900"
          title="T스쿨 메인으로"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>{hubLabel}</span>
        </a>
        <div className="flex-1" />
        <UtilityNav {...utility} />
      </div>

      {/* 아랫줄: 앱 고유 헤더 (앱이 주입) */}
      <div className="border-b border-gray-200">{children}</div>
    </header>
  );
}
