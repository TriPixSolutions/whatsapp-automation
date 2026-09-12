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
  accent?: 'gold' | 'emerald' | 'blue' | 'purple';
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  isPositive = true,
  icon: Icon,
  accent = 'gold',
}: StatCardProps) {
  const accentGradients = {
    gold: 'from-[#D4AF37] to-transparent',
    emerald: 'from-emerald-400 to-transparent',
    blue: 'from-cyan-400 to-transparent',
    purple: 'from-purple-400 to-transparent',
  };

  const iconColors = {
    gold: 'text-[#E6C687] bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0B0F17]/80 backdrop-blur-md border border-white/10 p-6 transition-all duration-300 hover:border-white/20 hover:shadow-luxury-md group">
      {/* Top subtle glow bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity',
          accentGradients[accent]
        )}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', iconColors[accent])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-semibold text-white tracking-tight font-sans">
          {value}
        </div>
        <div className="flex items-center gap-2 pt-1">
          {trend && (
            <span
              className={cn(
                'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded',
                isPositive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-xs text-zinc-400">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
