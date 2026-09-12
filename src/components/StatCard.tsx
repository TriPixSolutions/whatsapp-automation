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
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  isPositive = true,
  icon: Icon,
  accent = 'purple',
}: StatCardProps) {
  const iconColors = {
    blue: 'text-[#7C3AED] bg-purple-50 border-[#C4B5FD]',
    emerald: 'text-[#22C55E] bg-emerald-50 border-emerald-100',
    purple: 'text-[#7C3AED] bg-purple-50 border-[#C4B5FD]',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105', iconColors[accent])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-black text-[#0D0F2D] tracking-tight">
          {value}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {trend && (
            <span
              className={cn(
                'text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full',
                isPositive
                  ? 'text-[#22C55E] bg-emerald-50 border border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border border-rose-200'
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-xs text-[#64748B]">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
