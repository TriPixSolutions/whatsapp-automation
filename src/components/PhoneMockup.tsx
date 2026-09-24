'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCheck,
  MoreVertical,
  Phone,
  Video,
  ChevronLeft,
  Sun,
  Moon,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Layers,
  List as ListIcon,
  Play,
  FileText,
  Music,
  MapPin,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhoneMockupProps {
  businessName?: string;
  templateName?: string;
  bodyText?: string;
  headerText?: string;
  footerText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'button' | 'list' | 'carousel' | 'whatsapp_flow' | 'template';
  buttons?: { id: string; title: string }[];
  sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  cards?: { headerImage?: string; title: string; description: string; buttons: { id: string; title: string }[] }[];
  flowTitle?: string;
  flowCta?: string;
  showInboundReply?: boolean;
  inboundText?: string;
  onButtonClick?: (title: string) => void;
  className?: string;
}

export function PhoneMockup({
  businessName = 'TriPix Concierge',
  templateName = 'teaser_alert',
  bodyText = 'Hello! Welcome to our automated WhatsApp VIP concierge. How can we assist you today?',
  headerText = 'TriPix Private Showcase',
  footerText = 'Confidential • By Invitation Only',
  mediaUrl,
  mediaType = 'image',
  messageType = 'button',
  buttons = [
    { id: 'btn_specs', title: 'Browse Products' },
    { id: 'btn_pricing', title: 'VIP Pricing' },
    { id: 'btn_agent', title: 'Talk to Agent' },
  ],
  sections = [
    {
      title: 'Luxury Collections',
      rows: [
        { id: 'row_1', title: 'Grand Tourbillon', description: 'Limited edition of 25 pieces' },
        { id: 'row_2', title: 'Perpetual Calendar', description: 'Handcrafted rose gold casing' },
      ],
    },
  ],
  cards = [
    {
      headerImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=80',
      title: 'Grand Complication Watch',
      description: 'Exclusive handmade timepiece featuring 18k rose gold and sapphire crystal.',
      buttons: [{ id: 'card_btn_1', title: 'View Details' }, { id: 'card_btn_2', title: 'Reserve Piece' }],
    },
    {
      headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
      title: 'Signature Chronograph',
      description: 'Aerospace-grade titanium alloy with 72-hour power reserve.',
      buttons: [{ id: 'card_btn_3', title: 'View Specs' }],
    },
  ],
  flowTitle = 'Book Private Consultation',
  flowCta = 'Start Booking',
  showInboundReply = false,
  inboundText = 'Show me',
  onButtonClick,
  className,
}: PhoneMockupProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [lastUserReply, setLastUserReply] = useState<string | null>(null);

  const handleSimulateClick = (title: string) => {
    setLastUserReply(title);
    onButtonClick?.(title);
  };

  return (
    <div
      className={cn(
        'relative mx-auto w-[340px] rounded-[52px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-2xl border-4 border-slate-600/40 select-none transition-all',
        className
      )}
    >
      {/* Outer Phone Bezel & Dynamic Island */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
        <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60" />
      </div>

      {/* Screen Frame */}
      <div
        className={cn(
          'relative w-full h-[640px] rounded-[40px] overflow-hidden flex flex-col border transition-colors',
          isDarkMode ? 'bg-[#0b141a] border-slate-900 text-white' : 'bg-[#EFEAE2] border-slate-200 text-slate-900'
        )}
      >
        {/* WhatsApp Top Status & Navigation Bar */}
        <div
          className={cn(
            'pt-8 pb-2.5 px-3 flex items-center justify-between shadow-xs z-20 transition-colors',
            isDarkMode ? 'bg-[#202c33] text-white' : 'bg-[#008069] text-white'
          )}
        >
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5 text-white/90" />
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs leading-tight">{businessName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Verified Business" />
              </div>
              <p className="text-[10px] text-white/75 font-mono">Official Business Account</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/90">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              title={isDarkMode ? 'Switch to Light WhatsApp' : 'Switch to Dark WhatsApp'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <Video className="w-4 h-4" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* WhatsApp Chat Wallpaper Area */}
        <div
          className={cn(
            'flex-1 p-3.5 space-y-3 overflow-y-auto relative',
            isDarkMode
              ? 'bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b141a]'
              : 'bg-[radial-gradient(#d1d7db_1px,transparent_1px)] [background-size:16px_16px] bg-[#EFEAE2]'
          )}
        >
          {/* Timestamp Badge */}
          <div className="flex justify-center my-1">
            <span
              className={cn(
                'text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono shadow-2xs',
                isDarkMode ? 'bg-[#182229] text-slate-400' : 'bg-white/80 text-slate-600'
              )}
            >
              Today
            </span>
          </div>

          {/* WhatsApp Outbound Message Bubble */}
          <div
            className={cn(
              'max-w-[90%] ml-auto rounded-2xl rounded-tr-xs p-3 shadow-xs space-y-2',
              isDarkMode
                ? 'bg-[#005c4b] text-white border border-emerald-600/30'
                : 'bg-[#D9FDD3] text-slate-900 border border-emerald-100'
            )}
          >
            {/* Header Text */}
            {headerText && (
              <p
                className={cn(
                  'text-xs font-bold tracking-wide border-b pb-1',
                  isDarkMode ? 'text-emerald-200 border-white/10' : 'text-emerald-950 border-emerald-200/60'
                )}
              >
                {headerText}
              </p>
            )}

            {/* Media Attachment if available */}
            {mediaUrl && (
              <div className="rounded-xl overflow-hidden my-1 max-h-36 border border-black/10">
                {mediaType === 'video' ? (
                  <div className="relative bg-black h-36 flex items-center justify-center text-white">
                    <Play className="w-8 h-8 opacity-80" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Message Media" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Message Body */}
            <p className="text-xs leading-relaxed font-sans">{bodyText}</p>

            {/* Footer Text */}
            {footerText && (
              <p
                className={cn(
                  'text-[10px] italic pt-1 border-t',
                  isDarkMode ? 'text-emerald-200/70 border-white/10' : 'text-slate-500 border-emerald-200/50'
                )}
              >
                {footerText}
              </p>
            )}

            {/* Timestamp & Status Checkmarks */}
            <div
              className={cn(
                'flex items-center justify-end gap-1 text-[9px] pt-0.5',
                isDarkMode ? 'text-emerald-200' : 'text-slate-500'
              )}
            >
              <span>12:00 PM</span>
              <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
            </div>
          </div>

          {/* Interactive Quick Reply Buttons */}
          {(messageType === 'button' || messageType === 'template') && buttons && buttons.length > 0 && (
            <div className="max-w-[90%] ml-auto space-y-1 pl-4">
              {buttons.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleSimulateClick(btn.title)}
                  className={cn(
                    'w-full py-2 px-3 rounded-xl text-xs font-semibold text-center shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer',
                    isDarkMode
                      ? 'bg-[#202c33] hover:bg-[#2a3942] text-emerald-400 border border-emerald-500/20'
                      : 'bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200/80'
                  )}
                >
                  <span>{btn.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Interactive List Button */}
          {messageType === 'list' && (
            <div className="max-w-[90%] ml-auto pl-4">
              <button
                type="button"
                onClick={() => setShowListMenu(!showListMenu)}
                className={cn(
                  'w-full py-2 px-3 rounded-xl text-xs font-semibold text-center shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  isDarkMode
                    ? 'bg-[#202c33] hover:bg-[#2a3942] text-emerald-400 border border-emerald-500/20'
                    : 'bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200'
                )}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>View Options List</span>
              </button>
            </div>
          )}

          {/* Interactive WhatsApp Flow CTA Button */}
          {messageType === 'whatsapp_flow' && (
            <div className="max-w-[90%] ml-auto pl-4">
              <button
                type="button"
                onClick={() => setShowFlowModal(true)}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{flowCta}</span>
              </button>
            </div>
          )}

          {/* Interactive Carousel Cards Swiper */}
          {messageType === 'carousel' && cards && cards.length > 0 && (
            <div className="max-w-[95%] ml-auto space-y-2">
              <div
                className={cn(
                  'rounded-2xl overflow-hidden p-3 shadow-xs space-y-2 border transition-all',
                  isDarkMode ? 'bg-[#202c33] text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
                )}
              >
                {cards[activeCardIndex]?.headerImage && (
                  <div className="h-28 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cards[activeCardIndex].headerImage}
                      alt={cards[activeCardIndex].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h5 className="font-bold text-xs">{cards[activeCardIndex]?.title}</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {cards[activeCardIndex]?.description}
                </p>

                <div className="space-y-1 pt-1">
                  {cards[activeCardIndex]?.buttons.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSimulateClick(b.title)}
                      className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-center transition-colors cursor-pointer"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>

                {/* Carousel Navigator */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <button
                    type="button"
                    disabled={activeCardIndex === 0}
                    onClick={() => setActiveCardIndex((idx) => Math.max(0, idx - 1))}
                    className="p-1 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>
                    Card {activeCardIndex + 1} of {cards.length}
                  </span>
                  <button
                    type="button"
                    disabled={activeCardIndex === cards.length - 1}
                    onClick={() => setActiveCardIndex((idx) => Math.min(cards.length - 1, idx + 1))}
                    className="p-1 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Inbound Reply Bubble (Simulated click result) */}
          {(lastUserReply || showInboundReply) && (
            <div
              className={cn(
                'max-w-[75%] mr-auto rounded-2xl rounded-tl-xs p-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200',
                isDarkMode ? 'bg-[#202c33] text-white border border-white/5' : 'bg-white text-slate-900 border border-slate-200'
              )}
            >
              <p className="text-xs font-medium">{lastUserReply || inboundText}</p>
              <div
                className={cn(
                  'flex items-center justify-end text-[9px] pt-0.5',
                  isDarkMode ? 'text-slate-400' : 'text-slate-400'
                )}
              >
                <span>12:02 PM</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive List Selector Modal */}
        {showListMenu && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-black/60 z-30 flex flex-col justify-end animate-in fade-in duration-150">
            <div
              className={cn(
                'rounded-t-3xl p-4 max-h-[70%] overflow-y-auto space-y-3 shadow-2xl',
                isDarkMode ? 'bg-[#202c33] text-white' : 'bg-white text-slate-900'
              )}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold">Select an Option</h4>
                <button
                  type="button"
                  onClick={() => setShowListMenu(false)}
                  className="text-xs font-bold p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {sec.title}
                  </span>
                  <div className="space-y-1">
                    {sec.rows.map((row) => (
                      <div
                        key={row.id}
                        onClick={() => {
                          handleSimulateClick(row.title);
                          setShowListMenu(false);
                        }}
                        className={cn(
                          'p-2.5 rounded-xl border cursor-pointer transition-colors',
                          isDarkMode
                            ? 'bg-[#182229] border-slate-700 hover:bg-[#2a3942]'
                            : 'bg-slate-50 border-slate-200 hover:bg-emerald-50'
                        )}
                      >
                        <p className="text-xs font-bold">{row.title}</p>
                        {row.description && <p className="text-[10px] text-slate-400 mt-0.5">{row.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive WhatsApp Flow Modal Sheet */}
        {showFlowModal && (
          <div className="absolute inset-x-0 bottom-0 top-16 bg-black/60 z-40 flex flex-col justify-end animate-in fade-in duration-150">
            <div
              className={cn(
                'rounded-t-3xl p-5 max-h-[85%] overflow-y-auto space-y-4 shadow-2xl',
                isDarkMode ? 'bg-[#182229] text-white' : 'bg-white text-slate-900'
              )}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold">{flowTitle}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFlowModal(false)}
                  className="text-xs font-bold p-1 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Select Consultation Date</label>
                  <input
                    type="date"
                    defaultValue="2026-09-30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Inquiry Category</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800">
                    <option>Bespoke Custom Jewelry</option>
                    <option>Luxury Horology Consultation</option>
                    <option>Private Showroom Booking</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSimulateClick('Consultation Request Submitted');
                    setShowFlowModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Submit WhatsApp Flow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Bottom Input Area */}
        <div
          className={cn(
            'p-2.5 flex items-center gap-2 border-t transition-colors',
            isDarkMode ? 'bg-[#202c33] text-slate-400 border-slate-800' : 'bg-[#F0F2F5] text-slate-500 border-slate-200'
          )}
        >
          <div
            className={cn(
              'flex-1 rounded-full px-3.5 py-1.5 text-xs',
              isDarkMode ? 'bg-[#2a3942] text-slate-300' : 'bg-white text-slate-700 shadow-2xs'
            )}
          >
            Type a message...
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 shadow-xs">
            <span className="text-xs font-bold">▶</span>
          </div>
        </div>
      </div>
    </div>
  );
}
