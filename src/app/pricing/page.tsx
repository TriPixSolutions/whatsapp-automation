import React from 'react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { PricingHero } from '@/components/pricing/PricingHero';
import { HomePricing } from '@/components/home/HomePricing';
import { HomeFaq } from '@/components/home/HomeFaq';
import { HomeCta } from '@/components/home/HomeCta';

export const metadata = {
  title: 'Pricing Plans | AI WhatsApp Sales & Support Platform',
  description: 'Transparent pricing for businesses scaling WhatsApp sales, team inboxes, and AI customer support.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#0D0F2D] flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <PublicNav />
      <main className="flex-1">
        <PricingHero />
        <HomePricing />
        <HomeFaq />
        <HomeCta />
      </main>
      <PublicFooter />
    </div>
  );
}
