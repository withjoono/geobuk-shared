/**
 * 공유 푸터 컴포넌트 (Shared Footer)
 *
 * 모든 앱에서 동일하게 사용하는 푸터입니다.
 * - 프레임워크 독립적: <a> 태그만 사용 (TanStack, Next.js 모두 호환)
 * - 이미지/링크: Hub 본사이트(https://www.tskool.kr)의 절대 경로 사용
 *   (위성앱들은 다른 도메인이므로 상대경로 금지)
 * - 인스타 아이콘은 호스팅 에셋이 없어 lucide-react 사용 (소비 앱이 lucide-react 제공)
 *
 * 3단 레이아웃: 좌(로고+T스쿨) · 중(사업자정보+정책링크) · 우(네이버카페·유튜브·인스타)
 */

import React from 'react';

// 인스타 아이콘 — lucide 버전 의존을 피하기 위해 인라인 SVG (feather/lucide 스타일)
const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const HUB_URL = 'https://www.tskool.kr';
const LOGO_URL = `${HUB_URL}/logo.png`;
const YOUTUBE_ICON_URL = `${HUB_URL}/icons/youtube.png`;
const NAVER_CAFE_ICON_URL = `${HUB_URL}/icons/naver-cafe.png`;

const YOUTUBE_URL = 'https://www.youtube.com/@turtleschool_official';
const NAVER_CAFE_URL = 'https://cafe.naver.com/turtlecorp';
// TODO: 실제 인스타그램 계정으로 확인/교체
const INSTAGRAM_URL = 'https://www.instagram.com/turtleschool_official/';

export const Footer = () => {
  return (
    <footer className="border-t bg-gray-50 py-6 sm:py-8 dark:bg-gray-900/50">
      <div className="mx-auto w-full max-w-screen-lg px-6">
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-10">
          {/* 좌: 로고 + T스쿨 */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <img className="h-auto w-16 rounded-xl sm:w-20" src={LOGO_URL} alt="T스쿨 로고" />
            <span className="text-base font-semibold text-foreground sm:text-lg">T스쿨</span>
          </div>

          {/* 중: 사업자 정보 + 정책 링크 */}
          <div className="flex flex-col gap-3 text-center">
            <div className="flex flex-col gap-1 text-xs text-foreground/70 sm:text-sm">
              <span>사업체명 (주)거북스쿨 | 대표 강준호</span>
              <span>사업자등록번호 772-87-02782 | 연락처 042-484-3356 / 010-2518-7139</span>
              <span>서울시 성북구 화랑로 211 성북구 기술창업센터 105호</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-sm font-medium">
              <a
                href={`${HUB_URL}/explain/service`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                이용약관
              </a>
              <a
                href={`${HUB_URL}/explain/refund`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                환불규정
              </a>
              <a
                href={`${HUB_URL}/explain/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:underline"
              >
                개인정보처리방침
              </a>
            </div>
          </div>

          {/* 우: 소셜 (네이버카페 · 유튜브 · 인스타) */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="flex items-center gap-4">
              <a
                href={NAVER_CAFE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="네이버 카페"
                className="transition-transform hover:scale-110"
              >
                <img className="h-10 w-10 rounded-lg" src={NAVER_CAFE_ICON_URL} alt="네이버 카페" />
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="유튜브"
                className="transition-transform hover:scale-110"
              >
                <img className="h-10 w-10 rounded-lg" src={YOUTUBE_ICON_URL} alt="YouTube" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="인스타그램"
                className="transition-transform hover:scale-110"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white">
                  <InstagramIcon />
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-4 border-t border-foreground/10 pt-3 text-center text-xs text-foreground/50">
          © 2027 (주)거북스쿨. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
