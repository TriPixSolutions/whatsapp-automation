'use client';

import React, { useState } from 'react';
import { Send, Smartphone, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickSenderCardProps {
  onMessageSent?: () => void;
}

export function QuickSenderCard({ onMessageSent }: QuickSenderCardProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: phone.trim(),
          type: 'text',
          content: { text: message.trim() },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ success: true, message: `Dispatched to ${phone}` });
        setPhone('');
        setMessage('');
        if (onMessageSent) onMessageSent();
      } else {
        setStatus({ success: false, message: data.error || 'Dispatch failed' });
      }
    } catch (err: any) {
      setStatus({ success: false, message: err.message || 'Connection error' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-slate-700" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider font-mono text-slate-900">
            Instant WhatsApp Dispatch
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Recipient Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Include country code (e.g. +1...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Message Text
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message content..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
            />
          </div>

          {status && (
            <div
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                status.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{status.message}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending...' : 'Send Message'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
