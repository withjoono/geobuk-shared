import React from 'react';

export function AcornIcon({
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-acorn ${className}`}
      {...props}
    >
      {/* Acorn cap */}
      <path d="M4 10h16v2a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-2z" />
      <path d="M6 10V8a6 6 0 0 1 12 0v2" />
      <path d="M12 2v2" />
      <path d="M8 10h8" />
      {/* Acorn body */}
      <path d="M5.5 16C5.5 19.5 8.5 22 12 22C15.5 22 18.5 19.5 18.5 16" />
    </svg>
  );
}
