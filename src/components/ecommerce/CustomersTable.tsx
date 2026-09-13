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
import { MessageCircle } from 'lucide-react';

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  isValidForWhatsApp: boolean;
  dateAdded: string;
  platform: 'shopify' | 'woocommerce';
}

interface CustomersTableProps {
  loading: boolean;
  data: CustomerRow[];
}

export function CustomersTable({ loading, data }: CustomersTableProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs">
        No customer records found in connected store.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50/60">
          <TableHead>Customer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="text-right">Platform</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((c) => (
          <TableRow key={`${c.platform}_${c.id}`}>
            <TableCell className="font-semibold text-slate-900">
              {c.name}
            </TableCell>
            <TableCell className="font-mono text-slate-500 text-[11px]">
              {c.email || '—'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-slate-800">
                  {c.phone || '—'}
                </span>
                {c.isValidForWhatsApp && (
                  <Badge variant="success" className="text-[9px] gap-1">
                    <MessageCircle className="w-2.5 h-2.5" />
                    <span>WhatsApp</span>
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-slate-500 text-[11px]">
              {c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : '—'}
            </TableCell>
            <TableCell className="text-right">
              <Badge variant="secondary" className="capitalize text-[10px]">
                {c.platform}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
