import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-950 text-white shadow-2xs hover:bg-slate-800',
      destructive: 'bg-rose-600 text-white shadow-2xs hover:bg-rose-500',
      outline:
        'border border-slate-200 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:text-slate-900',
      secondary:
        'bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200/80',
      ghost: 'hover:bg-slate-100 hover:text-slate-900',
      link: 'text-indigo-600 underline-offset-4 hover:underline',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-xs font-semibold rounded-xl',
      sm: 'h-8 rounded-lg px-3 text-[11px] font-semibold',
      lg: 'h-10 rounded-xl px-5 text-sm font-semibold',
      icon: 'h-9 w-9 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
