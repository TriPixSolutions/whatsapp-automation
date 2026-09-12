import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export default function PassionFruitLogo({ size = 'md', showSubtitle = true, className = '' }: LogoProps) {
  const iconDimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textTitle = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const subText = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Passion Fruit Icon Badge */}
      <div className={`relative ${iconDimensions} rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#D946EF] to-[#FB923C] p-[2px] shadow-md shadow-fuchsia-500/20 transition-transform duration-300 hover:scale-105 flex-shrink-0`}>
        <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle tropical seed glow accents */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400/30 rounded-full blur-[2px]" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-fuchsia-500/40 rounded-full blur-[2px]" />
          
          {/* Stylized Passion Fruit Vector Silhouette */}
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor">
            {/* Outer shell contour */}
            <circle cx="12" cy="12" r="9" stroke="url(#pfGradient)" strokeWidth="2.2" strokeLinecap="round" />
            {/* Inner pulp starburst / seed arrangement */}
            <circle cx="12" cy="12" r="4.5" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="12" cy="8.5" r="1" fill="#FDE047" />
            <circle cx="14.5" cy="11" r="1" fill="#FDE047" />
            <circle cx="13.5" cy="14.5" r="1" fill="#FDE047" />
            <circle cx="9.5" cy="13.5" r="1" fill="#FDE047" />
            <circle cx="9.5" cy="9.5" r="1" fill="#FDE047" />
            {/* Top crown leaf */}
            <path d="M12 3C12 3 13.5 1 15 2C15 2 14.5 3.5 13.2 4.2" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
            <defs>
              <linearGradient id="pfGradient" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A855F7" />
                <stop offset="0.5" stopColor="#EC4899" />
                <stop offset="1" stopColor="#FB923C" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${textTitle}`}>
            Passion<span className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">Fruit</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live WABA Cloud Engine" />
        </div>
        {showSubtitle && (
          <p className={`font-medium tracking-wide text-slate-500 dark:text-slate-400 uppercase mt-0.5 ${subText}`}>
            WhatsApp Business Suite
          </p>
        )}
      </div>
    </div>
  );
}
