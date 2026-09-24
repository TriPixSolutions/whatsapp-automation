'use client';

import React from 'react';
import { Sparkles, CheckCheck, MoreVertical, Phone, Video, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneMockupProps {
  businessName?: string;
  templateName?: string;
  bodyText?: string;
  headerText?: string;
  footerText?: string;
  mediaUrl?: string;
  buttons?: { id: string; title: string }[];
  showInboundReply?: boolean;
  inboundText?: string;
  onButtonClick?: (title: string) => void;
  className?: string;
}

export function PhoneMockup({
  businessName = 'AURA Concierge',
  templateName = 'teaser_alert',
  bodyText = 'Something big is coming soon. Are you ready?',
  headerText = 'AURA Private Showcase',
  footerText = 'Confidential • By Invitation Only',
  mediaUrl,
  buttons = [
    { id: 'btn_specs', title: 'Product Specs' },
    { id: 'btn_pricing', title: 'Pricing' },
    { id: 'btn_agent', title: 'Talk to Agent' },
  ],
  showInboundReply = false,
  inboundText = 'Show me',
  onButtonClick,
  className,
}: PhoneMockupProps) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[330px] rounded-[48px] p-3.5 bg-gradient-to-b from-zinc-700 via-zinc-900 to-black shadow-2xl border border-white/20 select-none',
        className
      )}
    >
      {/* Outer Phone Bezel & Camera Island */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
      </div>

      {/* Screen Frame */}
      <div className="relative w-full h-[620px] rounded-[36px] bg-[#0c1317] overflow-hidden flex flex-col border border-zinc-800">
        {/* WhatsApp Top Navigation Bar */}
        <div className="pt-8 pb-2.5 px-3 bg-[#1f2c34] text-white flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5 text-emerald-400" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#8C6D15] flex items-center justify-center text-black font-bold text-xs shadow-gold-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-white">{businessName}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" title="Verified Business" />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Official Business Account</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-300">
            <Video className="w-4 h-4" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Chat Wallpaper Area */}
        <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0c1317]">
          {/* Timestamp Badge */}
          <div className="flex justify-center my-1">
            <span className="text-[10px] bg-[#182229] text-zinc-400 px-2.5 py-1 rounded-md uppercase tracking-wider font-mono shadow-sm">
              Today
            </span>
          </div>

          {/* Outbound Template Message (Test Flow 1) */}
          <div className="max-w-[85%] ml-auto bg-[#005c4b] text-white rounded-2xl rounded-tr-sm p-3 shadow-md border border-emerald-600/30 space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[10px] text-emerald-200">
              <span className="font-mono uppercase tracking-wide">Template: {templateName}</span>
              <Sparkles className="w-3 h-3 text-[#E6C687]" />
            </div>
            {mediaUrl && (
              <div className="rounded-lg overflow-hidden my-1 max-h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="Message Media" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs leading-relaxed text-zinc-100 font-sans">
              {bodyText}
            </p>
            <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 pt-0.5">
              <span>12:00 PM</span>
              <CheckCheck className="w-3 h-3 text-cyan-300" />
            </div>
          </div>

          {/* Inbound User Reply (Test Flow 2 Trigger) */}
          {showInboundReply && (
            <div className="max-w-[70%] mr-auto bg-[#202c33] text-white rounded-2xl rounded-tl-sm p-3 shadow-md border border-white/5 animate-in fade-in slide-in-from-bottom-3 duration-400">
              <p className="text-xs text-zinc-100 font-medium">{inboundText}</p>
              <div className="flex items-center justify-end text-[9px] text-zinc-400 pt-0.5">
                <span>12:02 PM</span>
              </div>
            </div>
          )}

          {/* Automated Interactive Message with 3 Quick Reply Buttons */}
          {showInboundReply && (
            <div className="max-w-[88%] ml-auto space-y-1.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Message Bubble */}
              <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-sm p-3 shadow-md border border-emerald-600/30 space-y-1">
                {headerText && (
                  <p className="text-xs font-bold text-[#E6C687] tracking-wide">
                    {headerText}
                  </p>
                )}
                <p className="text-xs text-zinc-100 leading-relaxed">
                  Discover our bespoke private portfolio. Select an option below to proceed:
                </p>
                {footerText && (
                  <p className="text-[10px] text-emerald-200 italic pt-1 border-t border-white/10">
                    {footerText}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 pt-0.5">
                  <span>12:02 PM</span>
                  <CheckCheck className="w-3 h-3 text-cyan-300" />
                </div>
              </div>

              {/* 3 Interactive Quick Reply Buttons */}
              <div className="space-y-1 pl-4">
                {buttons.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => onButtonClick?.(btn.title)}
                    className="w-full bg-[#202c33] hover:bg-[#2a3942] active:scale-[0.98] transition-all duration-150 border border-emerald-500/30 text-emerald-400 py-2 px-3 rounded-xl text-xs font-medium text-center shadow-sm flex items-center justify-center gap-2 group"
                  >
                    <span>{btn.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Bottom Input Area */}
        <div className="p-2.5 bg-[#1f2c34] flex items-center gap-2 text-zinc-400 border-t border-zinc-800">
          <div className="flex-1 bg-[#2a3942] rounded-full px-3.5 py-1.5 text-xs text-zinc-300">
            Type a message...
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
            <span className="text-xs font-bold">▶</span>
          </div>
        </div>
      </div>
    </div>
  );
}
