import React from 'react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SolutionsHero } from '@/components/solutions/SolutionsHero';
import { SolutionsGrid } from '@/components/solutions/SolutionsGrid';
import { HomeCta } from '@/components/home/HomeCta';

export const metadata = {
  title: 'Industry Solutions | AI WhatsApp Sales & Support Platform',
  description: 'Automated WhatsApp sales funnels, cart recovery, and lead qualification for modern e-commerce and high-ticket service brands.',
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />
      <main className="flex-1">
        <SolutionsHero />
        <SolutionsGrid />
        <HomeCta />
      </main>
      <PublicFooter />
    </div>
  );
}
