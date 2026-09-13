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

export interface OrderRow {
  id: string;
  customerName: string;
  status: string;
  totalAmount: string;
  date: string;
  platform: 'shopify' | 'woocommerce';
}

interface OrdersTableProps {
  loading: boolean;
  data: OrderRow[];
}

export function OrdersTable({ loading, data }: OrdersTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        No orders found in connected store.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/60">
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Platform</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((o) => (
          <TableRow key={`${o.platform}_${o.id}`}>
            <TableCell className="font-mono font-bold text-slate-900">
              {o.id}
            </TableCell>
            <TableCell className="font-medium text-slate-800">
              {o.customerName || 'Customer'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize text-[10px]">
                {o.status}
              </Badge>
            </TableCell>
            <TableCell className="font-semibold text-slate-900 font-mono">
              {o.totalAmount}
            </TableCell>
            <TableCell className="text-slate-500 text-[11px]">
              {o.date ? new Date(o.date).toLocaleDateString() : '—'}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="secondary" className="capitalize text-[10px]">
                {o.platform}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
