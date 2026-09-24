'use client';

import React, { useState } from 'react';
import {
  Check,
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
  List as ListIcon,
  Play,
  FileText,
  Music,
  MapPin,
  User,
  ShoppingBag,
  Tag,
  Copy,
  Paperclip,
  Share2,
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
  messageType?:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'location'
    | 'contact'
    | 'button'
    | 'list'
    | 'carousel'
    | 'template'
    | 'catalog'
    | 'whatsapp_flow'
    | 'coupon';
  buttons?: { id: string; title: string; type?: 'quick_reply' | 'call' | 'url'; url?: string; phone?: string }[];
  sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
  cards?: { headerImage?: string; title: string; description: string; buttons: { id: string; title: string }[] }[];
  location?: { name: string; address: string; latitude?: number; longitude?: number };
  contactCard?: { name: string; phone: string; organization?: string };
  catalogProduct?: { title: string; price: string; image?: string; subtitle?: string };
  couponCode?: string;
  fileName?: string;
  fileSize?: string;
  flowTitle?: string;
  flowCta?: string;
  showInboundReply?: boolean;
  inboundText?: string;
  onButtonClick?: (title: string) => void;
  className?: string;
}

export function PhoneMockup({
  businessName = 'TriPix Business',
  templateName = 'welcome_notice',
  bodyText = 'Hello {{name}}! Welcome to our official WhatsApp service. How can we assist you today?',
  headerText,
  footerText,
  mediaUrl,
  mediaType = 'image',
  messageType = 'text',
  buttons = [
    { id: 'btn_1', title: 'View Products' },
    { id: 'btn_2', title: 'Talk to Support' },
  ],
  sections = [
    {
      title: 'Our Services',
      rows: [
        { id: 'row_1', title: 'Catalog Inquiries', description: 'Browse active items and pricing' },
        { id: 'row_2', title: 'Order Tracking', description: 'Real-time status updates' },
        { id: 'row_3', title: 'Support Assistance', description: 'Direct contact with team' },
      ],
    },
  ],
  cards = [
    {
      headerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      title: 'Premium Watch Series',
      description: 'Handcrafted precision timepieces with sapphire crystal.',
      buttons: [{ id: 'card_btn_1', title: 'View Specs' }, { id: 'card_btn_2', title: 'Order Now' }],
    },
    {
      headerImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      title: 'Signature Athletic',
      description: 'Aerodynamic performance engineered for speed and comfort.',
      buttons: [{ id: 'card_btn_3', title: 'Select Size' }],
    },
  ],
  location = {
    name: 'TriPix Headquarters',
    address: 'Business Park Tower A, Suite 400',
  },
  contactCard = {
    name: 'Customer Support Lead',
    phone: '+1 (555) 019-2834',
    organization: 'TriPix Solutions Support',
  },
  catalogProduct = {
    title: 'Precision Mechanical Watch',
    price: '$249.00',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
    subtitle: 'Free Worldwide Shipping',
  },
  couponCode = 'WELCOME20',
  fileName = 'Product_Brochure_2026.pdf',
  fileSize = '2.4 MB PDF',
  flowTitle = 'Book Appointment',
  flowCta = 'Schedule Consultation',
  showInboundReply = false,
  inboundText = 'I am interested in placing an order',
  onButtonClick,
  className,
}: PhoneMockupProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [lastUserReply, setLastUserReply] = useState<string | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const handleSimulateClick = (title: string) => {
    setLastUserReply(title);
    onButtonClick?.(title);
  };

  const handleCopyCoupon = () => {
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  // Interpolate dynamic variables in preview for realism
  const formattedBody = (bodyText || '')
    .replace(/\{\{name\}\}/gi, 'Alex')
    .replace(/\{\{phone\}\}/gi, '+1 (555) 019-2834')
    .replace(/\{\{company\}\}/gi, 'TriPix');

  return (
    <div
      className={cn(
        'relative mx-auto w-[330px] rounded-[48px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700/60 select-none transition-all',
        className
      )}
    >
      {/* Top Phone Speaker & Camera Notch */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-between px-2.5">
        <div className="w-2 h-2 rounded-full bg-slate-800" />
        <div className="w-2 h-2 rounded-full bg-blue-950/80" />
      </div>

      {/* Screen Frame */}
      <div
        className={cn(
          'relative w-full h-[620px] rounded-[38px] overflow-hidden flex flex-col border transition-colors',
          isDarkMode ? 'bg-[#0b141a] border-slate-900 text-white' : 'bg-[#EFEAE2] border-slate-200 text-slate-900'
        )}
      >
        {/* WhatsApp Top Header */}
        <div
          className={cn(
            'pt-8 pb-2.5 px-3 flex items-center justify-between shadow-xs z-20 transition-colors',
            isDarkMode ? 'bg-[#202c33] text-white' : 'bg-[#008069] text-white'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChevronLeft className="w-5 h-5 text-white/90 shrink-0" />
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/20">
              {businessName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs leading-tight truncate">{businessName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Verified Business" />
              </div>
              <p className="text-[10px] text-white/80 font-mono truncate">Official Business Account</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/90 shrink-0">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <Video className="w-4 h-4" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* WhatsApp Chat Body Wallpaper */}
        <div
          className={cn(
            'flex-1 p-3 space-y-2.5 overflow-y-auto relative',
            isDarkMode
              ? 'bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b141a]'
              : 'bg-[radial-gradient(#d1d7db_1px,transparent_1px)] [background-size:16px_16px] bg-[#EFEAE2]'
          )}
        >
          {/* Date Stamp */}
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

          {/* Outbound Message Bubble */}
          <div
            className={cn(
              'max-w-[92%] ml-auto rounded-2xl rounded-tr-xs p-3 shadow-xs space-y-2',
              isDarkMode
                ? 'bg-[#005c4b] text-white border border-emerald-600/30'
                : 'bg-[#D9FDD3] text-slate-900 border border-emerald-100'
            )}
          >
            {/* Header Text (if present) */}
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

            {/* 1. Image Message */}
            {(messageType === 'image' || (mediaUrl && mediaType === 'image')) && mediaUrl && (
              <div className="rounded-xl overflow-hidden my-1 max-h-36 border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="WhatsApp Media" className="w-full h-full object-cover" />
              </div>
            )}

            {/* 2. Video Message */}
            {(messageType === 'video' || (mediaUrl && mediaType === 'video')) && (
              <div className="relative rounded-xl overflow-hidden my-1 bg-black h-36 flex items-center justify-center text-white border border-black/10">
                {mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full bg-slate-900" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-white">
                  0:45
                </span>
              </div>
            )}

            {/* 3. Audio Voice Note Message */}
            {messageType === 'audio' && (
              <div
                className={cn(
                  'flex items-center gap-2.5 p-2 rounded-xl my-1 border',
                  isDarkMode ? 'bg-[#004d3e] border-white/10' : 'bg-white/90 border-emerald-200/60'
                )}
              >
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </button>
                <div className="flex-1 space-y-1">
                  {/* Waveform Visualization */}
                  <div className="flex items-center gap-0.5 h-4">
                    {[40, 70, 30, 90, 60, 100, 50, 80, 45, 65, 85, 35, 75, 95, 55, 60].map((h, i) => (
                      <span
                        key={i}
                        className={cn('w-0.5 rounded-full', isDarkMode ? 'bg-emerald-300' : 'bg-emerald-600')}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>0:32</span>
                    <span>Voice Note</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Document PDF Message */}
            {messageType === 'document' && (
              <div
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl my-1 border',
                  isDarkMode ? 'bg-[#004d3e] border-white/10' : 'bg-white/90 border-emerald-200/60'
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 font-bold text-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{fileName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{fileSize}</p>
                </div>
              </div>
            )}

            {/* 5. Location Message */}
            {messageType === 'location' && (
              <div
                className={cn(
                  'rounded-xl overflow-hidden my-1 border',
                  isDarkMode ? 'bg-[#004d3e] border-white/10' : 'bg-white/90 border-emerald-200/60'
                )}
              >
                <div className="h-24 bg-emerald-100 dark:bg-emerald-950/40 relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md animate-bounce">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-2 space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{location.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{location.address}</p>
                </div>
              </div>
            )}

            {/* 6. Contact Card Message */}
            {messageType === 'contact' && (
              <div
                className={cn(
                  'rounded-xl p-2.5 my-1 border space-y-2',
                  isDarkMode ? 'bg-[#004d3e] border-white/10' : 'bg-white/90 border-emerald-200/60'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{contactCard.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{contactCard.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulateClick(`Contact: ${contactCard.name}`)}
                  className="w-full py-1 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 border-t border-slate-200 dark:border-white/10 pt-1.5 cursor-pointer"
                >
                  Message Contact
                </button>
              </div>
            )}

            {/* 7. Catalog Product Card */}
            {messageType === 'catalog' && (
              <div
                className={cn(
                  'rounded-xl overflow-hidden my-1 border space-y-2',
                  isDarkMode ? 'bg-[#004d3e] border-white/10' : 'bg-white/90 border-emerald-200/60'
                )}
              >
                {catalogProduct.image && (
                  <div className="h-28 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={catalogProduct.image} alt="Product" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-2 pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{catalogProduct.title}</h5>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {catalogProduct.price}
                    </span>
                  </div>
                  {catalogProduct.subtitle && (
                    <p className="text-[10px] text-slate-500">{catalogProduct.subtitle}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSimulateClick('View Catalog Item')}
                    className="w-full py-1 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 border-t border-slate-200 dark:border-white/10 pt-1 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>View item</span>
                  </button>
                </div>
              </div>
            )}

            {/* 8. Coupon Message Banner */}
            {messageType === 'coupon' && (
              <div
                className={cn(
                  'rounded-xl p-2.5 my-1 border-2 border-dashed space-y-1.5',
                  isDarkMode ? 'border-amber-400/40 bg-amber-950/20' : 'border-amber-500/50 bg-amber-50/80'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Exclusive Coupon</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Valid today</span>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 font-mono text-xs font-bold text-slate-900 dark:text-white">
                  <span>{couponCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCoupon}
                    className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>{copiedCoupon ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message Body Text */}
            <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{formattedBody}</p>

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

          {/* Interactive Button Messages & CTA Buttons */}
          {(messageType === 'button' || messageType === 'template') && buttons && buttons.length > 0 && (
            <div className="max-w-[92%] ml-auto space-y-1 pl-4">
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
                  {btn.type === 'call' && <Phone className="w-3 h-3 text-emerald-600" />}
                  {btn.type === 'url' && <ExternalLink className="w-3 h-3 text-blue-600" />}
                  <span>{btn.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Interactive List Button */}
          {messageType === 'list' && (
            <div className="max-w-[92%] ml-auto pl-4">
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

          {/* WhatsApp Flow CTA Button */}
          {messageType === 'whatsapp_flow' && (
            <div className="max-w-[92%] ml-auto pl-4">
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

          {/* Carousel Swiper */}
          {messageType === 'carousel' && cards && cards.length > 0 && (
            <div className="max-w-[96%] ml-auto space-y-2">
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

          {/* User Inbound Reply Simulation */}
          {(lastUserReply || showInboundReply) && (
            <div
              className={cn(
                'max-w-[80%] mr-auto rounded-2xl rounded-tl-xs p-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200',
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

        {/* List Menu Modal Sheet */}
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

        {/* WhatsApp Flow Modal Sheet */}
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
                    <option>Product Inquiries</option>
                    <option>Bulk Order Pricing</option>
                    <option>Technical Support</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSimulateClick('Consultation Request Submitted');
                    setShowFlowModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Submit WhatsApp Flow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Bottom Input Field Bar */}
        <div
          className={cn(
            'p-2.5 flex items-center gap-2 border-t transition-colors',
            isDarkMode ? 'bg-[#202c33] text-slate-400 border-slate-800' : 'bg-[#F0F2F5] text-slate-500 border-slate-200'
          )}
        >
          <div
            className={cn(
              'flex-1 rounded-full px-3.5 py-1.5 text-xs truncate',
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
