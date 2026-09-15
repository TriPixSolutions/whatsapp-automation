import React from 'react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { HomeHero } from '@/components/home/HomeHero';
import { HomePreview } from '@/components/home/HomePreview';
import { HomeMetrics } from '@/components/home/HomeMetrics';
import { HomeFeatures } from '@/components/home/HomeFeatures';
import { HomeWorkflow } from '@/components/home/HomeWorkflow';
import { HomeBenefits } from '@/components/home/HomeBenefits';
import { HomeIntegrations } from '@/components/home/HomeIntegrations';
import { HomePricing } from '@/components/home/HomePricing';
import { HomeFaq } from '@/components/home/HomeFaq';
import { HomeCta } from '@/components/home/HomeCta';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#0D0F2D] flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <PublicNav />
      <main className="flex-1">
        <HomeHero />
        <HomePreview />
        <HomeMetrics />
        <HomeFeatures />
        <HomeWorkflow />
        <HomeBenefits />
        <HomeIntegrations />
        <HomePricing />
        <HomeFaq />
        <HomeCta />
      </main>
      <PublicFooter />
    </div>
  );
}
