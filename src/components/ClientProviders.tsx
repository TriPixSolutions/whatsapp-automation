'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Dynamic lazy import with ssr: false to prevent bundling into initial server render
const AIChatWidget = dynamic(
  () => import('@/components/AIChatWidget').then((mod) => mod.AIChatWidget),
  { ssr: false }
);

export function ClientProviders() {
  return (
    <>
      <AIChatWidget />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
