'use client';

import React from 'react';
import { Store, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StoreDataHeaderProps {
  isConnected: boolean;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSync: () => void;
}

export function StoreDataHeader({
  isConnected,
  loading,
  searchQuery,
  onSearchChange,
  onSync,
}: StoreDataHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
            <span>Store Catalog &amp; Customers</span>
            {isConnected && (
              <Badge variant="success" className="text-[10px]">
                Active Sync
              </Badge>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Live directory of synced store customers, orders, and products
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search records..."
            className="w-full text-xs pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          onClick={onSync}
          disabled={loading || !isConnected}
          size="sm"
          variant="default"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Syncing...' : 'Sync Store'}</span>
        </Button>
      </div>
    </div>
  );
}
