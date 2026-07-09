import React from 'react';

/**
 * 결제 아이콘 — 동그라미 안 원화(₩). lucide 스타일 아웃라인 커스텀.
 * lucide 에 원화 아이콘이 없어 직접 그림. 24×24 · stroke-width 2 · round.
 */
export function WonCircleIcon({
  size = 24,
  color = 'currentColor',
  className = '',
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 8.5L10 15L12 11L14 15L15.5 8.5" />
      <path d="M9 12.2H15" />
    </svg>
  );
}
