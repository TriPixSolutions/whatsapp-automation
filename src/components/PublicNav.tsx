'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import PassionFruitLogo from './PassionFruitLogo';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Features', href: '/#features' },
  { name: 'How It Works', href: '/#workflow' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'FAQ', href: '/#faq' },
];

export function PublicNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs py-3'
          : 'bg-white/60 backdrop-blur-md border-b border-transparent py-4'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <PassionFruitLogo size="sm" showSubtitle={false} />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50/80 border border-indigo-200/60 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Meta Cloud v18.0
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/70 p-1 rounded-full border border-slate-200/70 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'px-4 py-1.5 rounded-full transition-all duration-150',
                  isActive
                    ? 'bg-white text-slate-950 font-bold shadow-2xs'
                    : 'hover:text-slate-950 hover:bg-white/60'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="gradient-button text-xs px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 group"
          >
            <span>Start Free</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[60px] bg-white/95 backdrop-blur-2xl border-b border-slate-200 p-6 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-1 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  pathname === link.href
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-800 bg-slate-100 rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full gradient-button py-2.5 text-center text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
