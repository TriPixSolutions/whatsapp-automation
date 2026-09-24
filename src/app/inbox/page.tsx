'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LiveTeamInbox } from '@/components/LiveTeamInbox';

export default function InboxPage() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pl-60">
        <Header
          title="Team Inbox"
          subtitle="Real-time multi-agent WhatsApp conversation hub & customer concierge"
        />

        <main className="flex-1 overflow-hidden p-2 sm:p-4 lg:p-6">
          <div className="h-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
            <LiveTeamInbox />
          </div>
        </main>
      </div>
    </div>
  );
}
