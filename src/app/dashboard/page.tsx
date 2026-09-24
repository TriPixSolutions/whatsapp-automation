'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardStatusBanner } from '@/components/dashboard/DashboardStatusBanner';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import {
  DashboardConversations,
  ConversationItem,
} from '@/components/dashboard/DashboardConversations';
import { QuickSenderCard } from '@/components/dashboard/QuickSenderCard';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [messagesSent, setMessagesSent] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState('0%');
  const [activeChats, setActiveChats] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [metaConfigured, setMetaConfigured] = useState(false);
  const [storesConnected, setStoresConnected] = useState({
    shopify: false,
    woocommerce: false,
  });

  const loadData = useCallback(async () => {
    try {
      const [msgRes, setRes, storeRes, contactRes] = await Promise.all([
        fetch('/api/messages'),
        fetch('/api/settings'),
        fetch('/api/ecommerce/settings').catch(() => null),
        fetch('/api/contacts').catch(() => null),
      ]);

      if (msgRes?.ok) {
        const msgData = await msgRes.json();
        if (msgData.stats) {
          setMessagesSent(msgData.stats.messagesSent || 0);
          setDeliveryRate(msgData.stats.deliveryRate || '0%');
          setActiveChats(msgData.stats.activeChatsCount || 0);
        }
        if (Array.isArray(msgData.conversations)) {
          setConversations(
            msgData.conversations.map((c: any) => ({
              id: c.phoneNumber || String(Date.now()),
              recipient: c.contactName || c.phoneNumber || 'Contact',
              preview: c.lastMessage || 'Message',
              status: c.status || 'sent',
              time: c.lastTime
                ? new Date(c.lastTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now',
            }))
          );
        }
      }

      if (setRes?.ok) {
        const settings = await setRes.json();
        if (
          settings.phoneNumberId &&
          settings.accessToken &&
          !settings.accessToken.includes('SAMPLE_TOKEN')
        ) {
          setMetaConfigured(true);
        }
      }

      if (storeRes?.ok) {
        const storeData = await storeRes.json();
        setStoresConnected({
          shopify: Boolean(storeData?.shopify?.shopDomain),
          woocommerce: Boolean(storeData?.woocommerce?.storeUrl),
        });
      }

      if (contactRes?.ok) {
        const contactData = await contactRes.json();
        if (contactData.contacts && Array.isArray(contactData.contacts)) {
          setContactsCount(contactData.contacts.length);
        }
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pl-0 md:pl-60 flex flex-col font-sans transition-all">
      <Sidebar />
      <Header
        title="Workspace Overview"
        subtitle="Live WhatsApp Business messaging, contacts, and store catalog"
      />

      <main className="p-4 sm:p-6 md:p-8 pb-24 md:pb-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        <DashboardHero
          metaConfigured={metaConfigured}
          activeChats={activeChats}
        />

        <DashboardStatusBanner
          metaConfigured={metaConfigured}
          storesConnected={storesConnected}
        />

        <DashboardMetrics
          loading={loading}
          messagesSent={messagesSent}
          deliveryRate={deliveryRate}
          activeChats={activeChats}
          contactsCount={contactsCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <DashboardConversations
              loading={loading}
              conversations={conversations}
            />
          </div>

          <div className="lg:col-span-5">
            <QuickSenderCard onMessageSent={loadData} />
          </div>
        </div>
      </main>
    </div>
  );
}
