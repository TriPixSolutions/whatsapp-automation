'use client';

import React from 'react';
import { Send, CheckCheck, MessageSquare, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardMetricsProps {
  loading: boolean;
  messagesSent: number;
  deliveryRate: string;
  activeChats: number;
  contactsCount: number;
}

export function DashboardMetrics({
  loading,
  messagesSent,
  deliveryRate,
  activeChats,
  contactsCount,
}: DashboardMetricsProps) {
  const metricItems = [
    {
      label: 'Outbound Messages',
      value: messagesSent.toLocaleString(),
      subtitle: 'Dispatched via Meta API',
      icon: Send,
    },
    {
      label: 'Delivery Rate',
      value: messagesSent > 0 ? deliveryRate : '—',
      subtitle: messagesSent > 0 ? 'Confirmed receipts' : 'No messages sent yet',
      icon: CheckCheck,
    },
    {
      label: 'Active Conversations',
      value: activeChats.toLocaleString(),
      subtitle: 'Open customer chats',
      icon: MessageSquare,
    },
    {
      label: 'Total Contacts',
      value: contactsCount.toLocaleString(),
      subtitle: 'Subscribed directory',
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricItems.map((metric, i) => (
        <Card key={i} className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {metric.label}
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <metric.icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-black text-slate-950 font-sans tracking-tight">
                  {metric.value}
                </div>
              )}
              <p className="text-xs text-slate-400 font-medium">
                {metric.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
