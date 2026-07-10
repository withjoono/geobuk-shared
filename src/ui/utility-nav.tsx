import React, { useState, useRef, useEffect } from 'react';
import { BellRing, Users, LogOut, ChevronDown } from 'lucide-react';
import { AcornIcon } from './icons/acorn-icon.js';
import { WonCircleIcon } from './icons/won-circle-icon.js';

// 아바타 렌더러
function DefaultAvatar({ fallback, size = 28 }: { fallback: string; size?: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: '#f3f4f6',
      color: '#4b5563',
      fontSize: '12px',
      fontWeight: 'bold',
      flexShrink: 0
    }}>
      {fallback}
    </div>
  );
}

export interface UtilityNavProps {
  // 인증 여부
  isLoggedIn: boolean;
  // 사용자 정보 (자유로운 형태 지원)
  user?: {
    nickname?: string;
    profileImage?: string;
    is_ranker?: boolean;
    role?: string;
    role_type?: string;
  };
  // 데이터
  acornBalance?: number;
  // 라우팅 (외부 컴포넌트 주입)
  LinkComponent?: React.ElementType;
  // 액션
  onLogout?: (e?: React.MouseEvent) => void;
  // 디자인 테마
  isScrolled?: boolean;
  /** 얇은 상단바용 컴팩트 모드: 아이콘/버튼 작게 + 로그인은 배경·pill 없는 텍스트 링크 */
  compact?: boolean;

  // Link URL 설정
  urls?: {
    products?: string;
    notifications?: string;
    accountLinkage?: string;
    login?: string;
    profile?: string;
    payment?: string;
    officer?: string;
  };
}

export function UtilityNav({
  isLoggedIn,
  user,
  acornBalance = 0,
  LinkComponent = 'a',
  onLogout,
  isScrolled = true,
  compact = false,
  urls = {
    products: '/products',
    notifications: '/notifications',
    accountLinkage: '/account-linkage',
    login: '/auth/login',
    profile: '/users/profile',
    payment: '/users/payment',
    officer: '/officer/apply',
  }
}: UtilityNavProps) {
  const [acornOpen, setAcornOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const acornRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (acornRef.current && !acornRef.current.contains(event.target as Node)) {
        setAcornOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 아이콘/버튼 크기는 인라인 style + size prop으로 강제한다.
  // Tailwind 클래스(특히 h-[18px] 같은 임의값)는 소비 앱의 content 스캔에 없으면
  // purge 되어 버려 lucide 기본 24px로 폴백해버리기 때문.
  // compact(EcosystemHeader 1단 얇은 바)는 T스쿨 메인 헤더보다 한 단계 더 작고 얇게.
  const ICON_SIZE = compact ? 16 : 20;
  const BTN_SIZE = compact ? 28 : 40;
  const ICON_STROKE = compact ? 1.5 : 2;
  const acornSize = ICON_SIZE;
  const buttonBoxStyle: React.CSSProperties = { width: BTN_SIZE, height: BTN_SIZE };
  // compact 모드의 텍스트(T스쿨 라벨/사용자명/랭커 배지/로그인)는 전부 이 크기·굵기로 통일.
  const compactTextStyle: React.CSSProperties | undefined = compact
    ? { fontSize: 11, fontWeight: 500 }
    : undefined;

  const buttonClass = `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${
    isScrolled ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-white/90 hover:bg-white/10'
  }`;

  const isOfficer = user?.role === 'officer' || user?.role_type === 'officer';

  return (
    <div className="flex items-center gap-1">
      {/* 1. 도토리 */}
      {isLoggedIn && (
        <div
          className="relative"
          ref={acornRef}
          onMouseEnter={() => setAcornOpen(true)}
          onMouseLeave={() => setAcornOpen(false)}
        >
          <button
            onClick={() => setAcornOpen((v) => !v)}
            className={buttonClass}
            style={buttonBoxStyle}
            title="내 도토리 잔액 확인"
          >
            <AcornIcon size={acornSize} color="currentColor" />
          </button>

          {acornOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="text-sm text-gray-500 font-medium">내 도토리 잔액</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">{acornBalance.toLocaleString()}</span>
                <span className="text-gray-500">개</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. 결제 — 동그라미 안 원(₩) */}
      <LinkComponent href={urls.products} to={urls.products} className={buttonClass} style={buttonBoxStyle} title="이용권 구매">
        <WonCircleIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </LinkComponent>

      {/* 3. 알림 */}
      <LinkComponent href={urls.notifications} to={urls.notifications} className={`${buttonClass} relative`} style={buttonBoxStyle} title="알림">
        <BellRing size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </LinkComponent>

      {/* 4. 계정연동 — 사람 둘 겹침 */}
      <LinkComponent href={urls.accountLinkage} to={urls.accountLinkage} className={buttonClass} style={buttonBoxStyle} title="계정연동">
        <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      </LinkComponent>

      {/* 5. 로그인 / 유저프로필 */}
      {isLoggedIn && user ? (
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`flex items-center gap-2 px-2 ${compact ? 'py-0.5 h-7' : 'py-2 h-10'} rounded-md transition-colors ${
              isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
          >
            {user.profileImage ? (
              <img src={user.profileImage} alt="profile" className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} rounded-full object-cover`} />
            ) : (
              <DefaultAvatar fallback={user.nickname?.[0] || '?'} size={compact ? 20 : 28} />
            )}
            <span className="text-sm font-medium" style={compactTextStyle}>{user.nickname}</span>
            {user.is_ranker && (
              <span
                className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold text-white shadow-sm ml-1 bg-gradient-to-r from-amber-400 to-yellow-600"
                style={compactTextStyle}
              >
                👑 랭커
              </span>
            )}
            <ChevronDown style={{ width: compact ? 12 : 16, height: compact ? 12 : 16 }} strokeWidth={ICON_STROKE} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col py-1">
              <LinkComponent href={urls.profile} to={urls.profile} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" onClick={() => setUserMenuOpen(false)}>
                마이 페이지
              </LinkComponent>
              <LinkComponent href={urls.payment} to={urls.payment} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" onClick={() => setUserMenuOpen(false)}>
                결제내역
              </LinkComponent>
              {isOfficer && (
                <LinkComponent href={urls.officer} to={urls.officer} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" onClick={() => setUserMenuOpen(false)}>
                  평가자 전용
                </LinkComponent>
              )}
              <div className="h-px bg-gray-200 my-1"></div>
              <button
                onClick={(e) => {
                  setUserMenuOpen(false);
                  if (onLogout) onLogout(e);
                }}
                className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      ) : compact ? (
        // 컴팩트: 배경·pill 없는 텍스트 링크
        <LinkComponent
          href={urls.login}
          to={urls.login}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 8px',
            height: `${BTN_SIZE}px`,
            color: isScrolled ? '#374151' : '#ffffff',
            textDecoration: 'none',
            marginLeft: '2px',
            ...compactTextStyle,
          }}
        >
          로그인
        </LinkComponent>
      ) : (
        <LinkComponent
          href={urls.login}
          to={urls.login}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '36px',
            padding: '0 20px',
            borderRadius: '9999px',
            background: isScrolled ? '#2563eb' : 'rgba(255,255,255,0.2)', // blue-600 vs translucent
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            border: isScrolled ? 'none' : '1px solid rgba(255,255,255,0.3)',
            transition: 'all 200ms ease',
            marginLeft: '8px',
          }}
          className={isScrolled ? "hover:bg-blue-700" : "hover:bg-white/30"}
        >
          로그인
        </LinkComponent>
      )}
    </div>
  );
}
