'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import PassionFruitLogo from './PassionFruitLogo';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Solutions', href: '/solutions' },
  { name: 'Products', href: '/products' },
  { name: 'Integrations', href: '/integrations' },
  { name: 'About', href: '/about' },
];

export function PublicNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <PassionFruitLogo size="sm" showSubtitle={false} />
        </Link>

        {/* Desktop Multi-Page Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#64748B]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-purple-50 text-[#7C3AED] font-bold'
                    : 'hover:text-[#0D0F2D] hover:bg-[#F4F6FB]'
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Public Access Buttons (Strictly Auth-Guarded) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-bold text-[#0D0F2D] hover:text-[#7C3AED] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/login"
            className="gradient-button text-xs px-5 py-2.5 rounded-xl font-bold text-white shadow-pf-btn hover:shadow-pf-hover flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#0D0F2D] hover:bg-[#F4F6FB]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-bold text-[#0D0F2D] hover:bg-purple-50 hover:text-[#7C3AED]"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-bold text-[#0D0F2D] bg-[#F4F6FB] rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full gradient-button py-2.5 text-center text-xs font-bold text-white rounded-xl"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
