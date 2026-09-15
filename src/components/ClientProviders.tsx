'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic lazy import with ssr: false for fast initial page render
const AIChatWidget = dynamic(
  () => import('@/components/AIChatWidget').then((mod) => mod.AIChatWidget),
  { ssr: false }
);

export function ClientProviders() {
  return (
    <>
      <AIChatWidget />
    </>
  );
}
