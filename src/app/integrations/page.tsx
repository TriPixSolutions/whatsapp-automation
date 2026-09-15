import React from 'react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { IntegrationsHero } from '@/components/integrations/IntegrationsHero';
import { IntegrationsGrid } from '@/components/integrations/IntegrationsGrid';
import { HomeCta } from '@/components/home/HomeCta';

export const metadata = {
  title: 'Integrations | AI WhatsApp Sales & Support Platform',
  description: 'Connect Shopify, WooCommerce, Meta Cloud API, and CRM directly to WhatsApp in minutes.',
};

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <PublicNav />
      <main className="flex-1">
        <IntegrationsHero />
        <IntegrationsGrid />
        <HomeCta />
      </main>
      <PublicFooter />
    </div>
  );
}
