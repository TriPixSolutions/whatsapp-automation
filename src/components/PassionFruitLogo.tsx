'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'monochrome';
  showSubtitle?: boolean;
  className?: string;
  showIcon?: boolean;
}

export default function PassionFruitLogo({
  size = 'md',
  variant = 'light',
  showSubtitle = false,
  className = '',
  showIcon = true,
}: LogoProps) {
  // Dimensions based on size
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  // Official Brand Palette:
  // Midnight: #0D0F2D
  // Purple: #7C3AED
  // Lavender: #C4B5FD
  // Green: #22C55E
  // Neutral: #F4F6FB

  const passionColor =
    variant === 'dark'
      ? 'text-white'
      : variant === 'monochrome'
      ? 'text-[#0D0F2D]'
      : 'text-[#0D0F2D]';

  const fruitColor =
    variant === 'monochrome'
      ? 'text-[#0D0F2D]'
      : 'text-[#7C3AED]';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon Glyph */}
      {showIcon && (
        <div
          className={`relative ${iconSizes[size]} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${
            variant === 'dark' ? 'bg-[#0D0F2D] border border-white/10' : 'bg-white border border-[#E2E8F0]'
          }`}
          style={{
            boxShadow: '0 4px 12px -2px rgba(124, 58, 237, 0.15)',
          }}
        >
          {/* Custom Stylized Passion Fruit Vector SVG */}
          <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
            {/* Outer Ring */}
            <circle cx="16" cy="16" r="12" stroke="#7C3AED" strokeWidth="2.5" />
            {/* Pulp Arc / Core */}
            <circle cx="16" cy="16" r="6" stroke="#C4B5FD" strokeWidth="2" strokeDasharray="3 2" />
            {/* Seeds */}
            <circle cx="16" cy="12" r="1.2" fill="#7C3AED" />
            <circle cx="19.5" cy="15" r="1.2" fill="#7C3AED" />
            <circle cx="18" cy="19.5" r="1.2" fill="#7C3AED" />
            <circle cx="13" cy="18.5" r="1.2" fill="#7C3AED" />
            <circle cx="13" cy="14" r="1.2" fill="#7C3AED" />
            {/* Green Leaf Accent (#22C55E) */}
            <path
              d="M16 4C17 2 19 2.5 20 3.5C20 4.5 19 6 17.5 6.5"
              stroke="#22C55E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Official Brand Wordmark Typography: "Passion fruit" */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-extrabold tracking-tight font-display flex items-baseline gap-1.5 ${textSizes[size]}`}>
          {/* "Passion" in Midnight #0D0F2D (or White on dark) */}
          <span className={`${passionColor} font-black tracking-[-0.03em]`}>
            Passion
          </span>
          {/* "fruit" in Brand Purple #7C3AED */}
          <span className={`${fruitColor} font-black tracking-[-0.03em]`}>
            fruit
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`font-semibold tracking-wider uppercase text-[#64748B] mt-1 ${subtitleSizes[size]}`}
            style={{ letterSpacing: '0.08em' }}
          >
            Same energy. Bigger possibilities.
          </p>
        )}
      </div>
    </div>
  );
}
