import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  accent?: 'blue' | 'emerald' | 'purple' | 'amber';
  sparklineData?: number[];
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  isPositive = true,
  icon: Icon,
  accent = 'purple',
  sparklineData,
}: StatCardProps) {
  const accentStyles = {
    purple: {
      icon: 'text-indigo-600 bg-indigo-50 border-indigo-100/80 group-hover:border-indigo-200',
      stroke: '#6366F1',
      fill: 'url(#gradient-purple)',
      pulse: 'bg-indigo-500',
    },
    emerald: {
      icon: 'text-emerald-600 bg-emerald-50 border-emerald-100/80 group-hover:border-emerald-200',
      stroke: '#10B981',
      fill: 'url(#gradient-emerald)',
      pulse: 'bg-emerald-500',
    },
    blue: {
      icon: 'text-sky-600 bg-sky-50 border-sky-100/80 group-hover:border-sky-200',
      stroke: '#0EA5E9',
      fill: 'url(#gradient-blue)',
      pulse: 'bg-sky-500',
    },
    amber: {
      icon: 'text-amber-600 bg-amber-50 border-amber-100/80 group-hover:border-amber-200',
      stroke: '#F59E0B',
      fill: 'url(#gradient-amber)',
      pulse: 'bg-amber-500',
    },
  };

  const style = accentStyles[accent] || accentStyles.purple;

  // Default sparkline paths
  const defaultPositivePath = 'M0,28 C20,24 35,32 55,18 C75,6 95,20 115,10 C135,2 155,14 180,4';
  const defaultAreaPath = 'M0,28 C20,24 35,32 55,18 C75,6 95,20 115,10 C135,2 155,14 180,4 L180,36 L0,36 Z';

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col justify-between">
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-2xs',
            style.icon
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Metric value and sparkline */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="text-3xl font-black text-slate-950 tracking-tight font-sans">
          {value}
        </div>

        {/* Micro Sparkline Chart */}
        <div className="w-24 h-9 relative shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg
            viewBox="0 0 180 36"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gradient-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradient-emerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradient-amber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={defaultAreaPath} fill={style.fill} />
            <path
              d={defaultPositivePath}
              fill="none"
              stroke={style.stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Bottom row: Trend & Subtitle */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {trend && (
          <span
            className={cn(
              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1',
              isPositive
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
                : 'text-rose-700 bg-rose-50 border border-rose-200/80'
            )}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{trend}</span>
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-slate-500 truncate font-medium">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
