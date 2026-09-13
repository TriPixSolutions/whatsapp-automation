'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, ShoppingBag, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardStatusBannerProps {
  metaConfigured: boolean;
  storesConnected: { shopify: boolean; woocommerce: boolean };
}

export function DashboardStatusBanner({
  metaConfigured,
  storesConnected,
}: DashboardStatusBannerProps) {
  const isStoreConnected =
    storesConnected.shopify || storesConnected.woocommerce;

  const storeLabel = isStoreConnected
    ? storesConnected.shopify && storesConnected.woocommerce
      ? 'Shopify & WooCommerce'
      : storesConnected.shopify
      ? 'Shopify Active'
      : 'WooCommerce Active'
    : 'No Store Connected';

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
          <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Meta API:</span>
          <span className="font-bold text-slate-900">Cloud v18.0</span>
          <span
            className={cn(
              'w-2 h-2 rounded-full ml-0.5',
              metaConfigured ? 'bg-emerald-500' : 'bg-amber-400'
            )}
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
          <span>Catalog Sync:</span>
          <span className="font-bold text-slate-900">{storeLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link href="/dashboard/integrations">
          <Button variant="outline" size="sm">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Connect Store</span>
          </Button>
        </Link>

        <Link href="/campaigns">
          <Button variant="default" size="sm">
            <Send className="w-3.5 h-3.5" />
            <span>New Broadcast</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
