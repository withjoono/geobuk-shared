import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { UtilityNav, type UtilityNavProps } from './utility-nav.js';

/**
 * 2단 생태계 헤더 (거북스쿨 위성앱 공용).
 *
 *  ┌───────────────────────────────────────────────┐
 *  │ [⊞ T스쿨]                       < UtilityNav > │  ← 윗줄: 생태계/유틸 (모든 앱 공통)
 *  ├───────────────────────────────────────────────┤
 *  │ [로고 앱이름]  메뉴A  메뉴B  메뉴C …           │  ← 아랫줄: 앱 고유 네비 (앱이 주입)
 *  └───────────────────────────────────────────────┘
 *
 * - 윗줄 오른쪽은 기존 `UtilityNav` 를 그대로 재사용(도토리/결제/알림/계정/유저).
 * - 아랫줄 메뉴는 앱마다 다르므로 `children` 으로 주입(각 앱의 <a>/<Link>).
 * - 프레임워크 독립: 앱 홈 링크는 `LinkComponent`(주입) 사용, 티스쿨 이동은 절대경로 <a>.
 */
export interface EcosystemHeaderProps {
  /** 앱 이름. 예: 'T수시' */
  appName: string;
  /** 앱 로고 (이미지 노드 등). 생략 가능 */
  appLogo?: React.ReactNode;
  /** 앱 홈 경로. 기본 '/' */
  homeUrl?: string;
  /** 라우터 Link 주입(TanStack/Next 등). 기본 'a' */
  LinkComponent?: React.ElementType;
  /** 티스쿨 메인 URL. 기본 https://www.tskool.kr */
  hubUrl?: string;
  /** 윗줄 오른쪽 유틸 묶음(UtilityNav)으로 그대로 전달 */
  utility: UtilityNavProps;
  /** 아랫줄 앱 고유 메뉴 — 앱이 <a>/<Link> 로 주입 */
  children?: React.ReactNode;
}

export function EcosystemHeader({
  appName,
  appLogo,
  homeUrl = '/',
  LinkComponent = 'a',
  hubUrl = 'https://www.tskool.kr',
  utility,
  children,
}: EcosystemHeaderProps) {
  const Link = LinkComponent;

  return (
    <header className="sticky top-0 z-40 w-full bg-white">
      {/* 윗줄: 생태계 바 (티스쿨 이동 + UtilityNav) */}
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-1 text-xs">
        <a
          href={hubUrl}
          className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900"
          title="티스쿨 메인으로"
        >
          <LayoutGrid className="h-4 w-4" />
          <span>T스쿨</span>
        </a>
        <div className="flex-1" />
        <UtilityNav {...utility} />
      </div>

      {/* 아랫줄: 앱 고유 네비 */}
      <div className="flex h-12 items-center gap-5 border-b border-gray-200 px-4">
        <Link
          href={homeUrl}
          to={homeUrl}
          className="flex shrink-0 items-center gap-2 font-medium text-gray-900"
        >
          {appLogo}
          <span>{appName}</span>
        </Link>
        <nav className="flex items-center gap-4 overflow-x-auto text-sm text-gray-600">
          {children}
        </nav>
      </div>
    </header>
  );
}
