'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowRight, CheckCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export interface ConversationItem {
  id: string;
  recipient: string;
  preview: string;
  status: string;
  time: string;
}

interface DashboardConversationsProps {
  loading: boolean;
  conversations: ConversationItem[];
}

export function DashboardConversations({
  loading,
  conversations,
}: DashboardConversationsProps) {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-slate-950 flex items-center gap-2">
            <span>Customer Conversations</span>
            {!loading && (
              <Badge variant="secondary" className="text-[10px]">
                {conversations.length}
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of inbound customer replies and status
          </p>
        </div>

        <Link href="/inbox">
          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800">
            <span>Team Inbox</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between p-2">
                <div className="space-y-1.5 w-2/3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-xs font-bold text-slate-900">
                No active conversations
              </h4>
              <p className="text-xs text-slate-500">
                Outbound broadcasts and customer replies will appear here in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((msg) => (
              <div
                key={msg.id}
                onClick={() => router.push('/inbox')}
                className="py-3 px-2.5 flex items-start justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {msg.recipient}
                    </span>
                    <Badge variant="success" className="text-[9px] py-0 px-1.5">
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate font-normal">
                    {msg.preview}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 text-[11px] text-slate-400 font-mono">
                  <span>{msg.time}</span>
                  <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                    <CheckCheck className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
