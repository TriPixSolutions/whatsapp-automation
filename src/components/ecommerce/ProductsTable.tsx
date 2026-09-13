'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

export interface ProductRow {
  id: string;
  name: string;
  image: string | null;
  price: string;
  stockStatus: string;
  platform: 'shopify' | 'woocommerce';
}

interface ProductsTableProps {
  loading: boolean;
  data: ProductRow[];
}

export function ProductsTable({ loading, data }: ProductsTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        No products found in connected store catalog.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/60">
          <TableHead>Product</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Platform</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p) => (
          <TableRow key={`${p.platform}_${p.id}`}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="font-semibold text-slate-900 line-clamp-1">
                  {p.name}
                </span>
              </div>
            </TableCell>
            <TableCell className="font-mono font-semibold text-slate-900">
              {p.price}
            </TableCell>
            <TableCell>
              <Badge
                variant={p.stockStatus === 'In Stock' ? 'success' : 'outline'}
                className="text-[10px]"
              >
                {p.stockStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="secondary" className="capitalize text-[10px]">
                {p.platform}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
