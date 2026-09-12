'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  Users,
  Send,
  BarChart3,
  Bot,
  Zap,
  Globe,
  Inbox,
  ShoppingBag,
  Building,
  Plane,
  HeartPulse,
  GraduationCap,
  Car,
  Truck,
  Utensils,
  MessageSquare,
  ShieldCheck,
  Headphones,
  ExternalLink,
  PhoneCall,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { PhoneMockup } from '@/components/PhoneMockup';
import { cn } from '@/lib/utils';

export default function ZapeliteLandingPage() {
  const [activeTab, setActiveTab] = useState<'commerce' | 'marketing' | 'support' | 'feedback' | 'intelligence'>('commerce');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('real-estate');

  const capabilities = [
    { name: 'Integrations', icon: Globe, href: '/settings' },
    { name: 'CRM', icon: Users, href: '/contacts' },
    { name: 'Team Inbox', icon: Inbox, href: '/dashboard' },
    { name: 'Analytics', icon: BarChart3, href: '/dashboard' },
    { name: 'Bulk Broadcast', icon: Send, href: '/campaigns' },
    { name: 'Inbox', icon: MessageSquare, href: '/dashboard' },
    { name: 'AI Chatbot', icon: Bot, href: '/automations' },
    { name: 'Automation', icon: Zap, href: '/automations' },
  ];

  const industries = [
    {
      id: 'food-beverage',
      title: 'Food & Beverage',
      description: 'Direct ordering, loyalty programs, commission-free sales.',
      icon: Utensils,
      color: 'from-amber-500/10 to-orange-500/10',
      tag: 'Commerce & Menus',
    },
    {
      id: 'travel-hospitality',
      title: 'Travel & Visa Services',
      description: 'Document automation, real-time updates, client communication.',
      icon: Plane,
      color: 'from-cyan-500/10 to-blue-500/10',
      tag: 'Concierge & Booking',
    },
    {
      id: 'healthcare',
      title: 'Healthcare',
      description: 'Appointment booking, secure file sharing, patient communication.',
      icon: HeartPulse,
      color: 'from-rose-500/10 to-pink-500/10',
      tag: 'Secure & HIPAA',
    },
    {
      id: 'real-estate',
      title: 'Real Estate',
      description: 'Tenant communication, maintenance requests, rent reminders.',
      icon: Building,
      color: 'from-emerald-500/10 to-teal-500/10',
      tag: 'High-Ticket Lead Gen',
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Student engagement, attendance, digital content distribution.',
      icon: GraduationCap,
      color: 'from-purple-500/10 to-indigo-500/10',
      tag: 'Admissions & CRM',
    },
    {
      id: 'automotive',
      title: 'Automotive',
      description: 'Service booking, quotations, maintenance tracking.',
      icon: Car,
      color: 'from-blue-500/10 to-cyan-500/10',
      tag: 'Test Drives & Quotes',
    },
    {
      id: 'logistics',
      title: 'Logistics',
      description: 'Shipment tracking, delivery automation, customer updates.',
      icon: Truck,
      color: 'from-amber-500/10 to-yellow-500/10',
      tag: 'Real-time Tracking',
    },
  ];

  const productSuites = {
    commerce: {
      title: 'Commerce',
      description:
        "Turn WhatsApp into your business's digital storefront. Enable customers to browse catalogs, order products, and pay — all within chat. Simplify ordering, boost repeat sales, and deliver an experience on the channel they already trust.",
      features: [
        'Guided ordering flows on WhatsApp — no apps or downloads required',
        'Instant order tracking and delivery status updates via Meta webhooks',
        'One-click reorder and personalized upsell prompt buttons',
        'Integrated with POS, Shopify, WooCommerce, and payment gateways',
      ],
      previewHeadline: 'WhatsApp Native Catalog & Storefront',
    },
    marketing: {
      title: 'Marketing Suite',
      description:
        'Deliver targeted broadcasts with Meta-approved templates. Segment your audience by purchase history and custom tags, personalize parameters with dynamic variables, and track delivery receipts with 98%+ open rates.',
      features: [
        'Meta-approved template manager with live device preview',
        'Throttled 50ms batch sending via Hostinger BullMQ queue',
        'Dynamic audience segmentation and CSV bulk ingestion',
        'Real-time delivery receipts (sent, delivered, read, failed)',
      ],
      previewHeadline: 'High-Throughput Meta Bulk Broadcasts',
    },
    support: {
      title: 'Support Suite & Team Inbox',
      description:
        'Empower your team with a multi-agent shared WhatsApp inbox. Assign incoming customer conversations to department specialists, add internal notes, and automate resolution using canned responses.',
      features: [
        'Multi-agent shared team inbox with live typing indicators',
        'Intelligent lead routing and agent assignment rules',
        'Internal team collaboration and private customer notes',
        'Full conversation history and CRM contact profile drawer',
      ],
      previewHeadline: 'Collaborative Multi-Agent WhatsApp Console',
    },
    feedback: {
      title: 'Feedback & Insights',
      description:
        'Automate post-purchase feedback collection and customer satisfaction surveys. Trigger interactive 3-button rating cards right after order delivery or service completion to gather actionable NPS scores.',
      features: [
        'Automated post-purchase review requests via interactive buttons',
        'Real-time Net Promoter Score (NPS) and CSAT tracking',
        'Sentiment analysis and automated escalation for negative reviews',
        'Exportable feedback analytics and Google Reviews booster',
      ],
      previewHeadline: 'Automated CSAT & Feedback Collection',
    },
    intelligence: {
      title: 'Intelligence & Automations',
      description:
        'Build custom conversational workflows without writing code. Trigger instant interactive messages with up to 3 Quick Reply buttons whenever prospects send keywords like "Show me", "YES", or "Pricing".',
      features: [
        'Rule-based keyword and button reply trigger engine',
        'Meta Interactive Button cards ([Product Specs, Pricing, Talk to Agent])',
        '24/7 AI chatbot assistant with intelligent fallback to human agents',
        'Webhook callbacks connecting internal ERPs and CRMs',
      ],
      previewHeadline: 'Visual Rule Builder & Instant Auto-Responder',
    },
  };

  const integrations = [
    { name: 'Zoho CRM', color: '#E42528' },
    { name: 'HubSpot', color: '#FF7A59' },
    { name: 'Shopify', color: '#96BF48' },
    { name: 'Salesforce', color: '#00A1E0' },
    { name: 'WooCommerce', color: '#96588A' },
    { name: 'Stripe', color: '#635BFF' },
    { name: 'Google Sheets', color: '#0F9D58' },
    { name: 'Zapier', color: '#FF4A00' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#0066FF] selection:text-white">
      {/* 1. FIXED TOP NAVBAR (Zapelite style) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1650px] mx-auto h-16 px-4 sm:px-6 lg:px-16 xl:px-24 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white shadow-zap-btn group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#222222]">
                Zap<span className="text-[#0066FF]">Elite</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#777777] -mt-1">
                WhatsApp Cloud SaaS
              </span>
            </div>
          </Link>

          {/* Nav Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#555555]">
            <a href="#solutions" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors flex items-center gap-1">
              <span>Solutions</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </a>
            <a href="#products" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors flex items-center gap-1">
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </a>
            <Link href="/campaigns" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors">
              Features
            </Link>
            <a href="#integrations" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors flex items-center gap-1">
              <span>Integrations</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </a>
            <Link href="/dashboard" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors">
              Live Console
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-6 py-2 bg-white border border-[#E5E7EB] text-[#555555] rounded-md text-sm font-medium hover:bg-[#222222] hover:text-white transition-all duration-300 hidden md:block shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="gradient-button text-sm px-6 py-2 rounded-md"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-36 pb-12 px-4 sm:px-6 lg:px-16 xl:px-24 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-[#0066FF]/[0.03] via-transparent to-white">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#0066FF] mb-6 animate-in fade-in slide-in-from-top-2 duration-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL META WHATSAPP CLOUD API • ENTERPRISE WORKFLOW SAAS</span>
        </div>

        {/* Exact Zapelite Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#222222] max-w-5xl leading-[1.2]">
          B2B and B2C Communication and Workflow Automation Platform for{' '}
          <span className="gradient-text-blue font-bold">WhatsApp Business API</span>
        </h1>

        {/* Zapelite Description */}
        <p className="text-base sm:text-lg font-normal text-[#555555] max-w-3xl mt-6 leading-relaxed">
          ZapElite connects WhatsApp Business API, CRM systems, and internal business tools to orchestrate customer interactions across logistics, real estate, travel & hospitality, retail, automotive, food & beverage, healthcare, and education industries.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className="gradient-button text-base px-8 py-3.5 rounded-md font-semibold">
            Get Started
          </Link>
          <a
            href="#solutions"
            className="px-6 py-3.5 bg-white border border-[#E5E7EB] text-[#555555] rounded-md font-semibold text-base hover:bg-[#222222] hover:text-white duration-300 transition shadow-sm"
          >
            View All Solutions
          </a>
        </div>

        {/* 3. ZAPELITE 8-CAPABILITY ICON BAR */}
        <div className="w-full max-w-6xl mt-16 p-6 sm:p-8 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] shadow-sm relative">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 justify-items-center">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <Link
                  key={i}
                  href={cap.href}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-14 h-14 bg-[#ffffffcc] border-[3px] border-white p-3.5 rounded-xl transition-all duration-300 ease-in-out group-hover:bg-white group-hover:shadow-lg group-hover:scale-110 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-[#0066FF] group-hover:text-[#00C6FF] transition-colors" />
                  </div>
                  <p className="font-medium text-[#777777] group-hover:text-[#222222] text-xs text-center transition-colors">
                    {cap.name}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Interactive Console & Smartphone Preview Showcase */}
          <div className="mt-10 pt-8 border-t border-[#E5E7EB] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0066FF]">
                Enterprise Executive Console
              </span>
              <h3 className="text-2xl font-bold text-[#222222] tracking-tight">
                High-Throughput Meta Broadcasts & Live Conversational Automations
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Connect your business with millions of customers via the official Meta WhatsApp Cloud API. Run bulk broadcasts with 50ms rate-limit protection, capture inbound leads, and fire 3-button interactive cards instantly.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#222222] shadow-sm font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Meta v18.0 Cloud API
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#222222] shadow-sm font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Hostinger BullMQ Worker
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#222222] shadow-sm font-medium">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Supabase PostgreSQL Ledger
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <PhoneMockup
                businessName="ZapElite Concierge"
                templateName="teaser_alert"
                bodyText="Something big is coming soon. Are you ready?"
                headerText="ZapElite Private Drop"
                footerText="Official WhatsApp Business Verified"
                showInboundReply={true}
                inboundText="Show me"
                onButtonClick={(btn) => alert(`You clicked: ${btn}`)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. TAILORED SOLUTIONS FOR EVERY INDUSTRY (#solutions) */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
                Tailored Solutions for Every <span className="gradient-heading font-bold">Industry</span>
              </h2>
              <p className="text-base text-[#555555] max-w-xl">
                Scalable WhatsApp workflows built for your business.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066FF] hover:underline"
            >
              <span>Explore all industry templates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Industry Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.id}
                  className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-zap-sm hover:shadow-zap-lg hover:border-[#0066FF]/30 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-[#0066FF] group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0066FF] font-mono">
                        {ind.tag}
                      </span>
                      <h3 className="text-lg font-bold text-[#222222] mt-1">{ind.title}</h3>
                      <p className="text-xs text-[#555555] mt-2 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/campaigns?industry=${ind.id}`}
                    className="pt-6 flex items-center text-xs font-semibold text-[#0066FF] group-hover:text-[#00C6FF] transition-colors gap-1.5"
                  >
                    <span>Read more</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SUITES INTERACTIVE TABS (#products) */}
      <section id="products" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-[#FAFAFA] border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
              One Platform. Endless <span className="gradient-heading font-bold">Possibilities.</span>
            </h2>
            <p className="text-base text-[#555555] max-w-xl mx-auto">
              Zapelite product suites designed to power modern enterprises.
            </p>
          </div>

          {/* Tabs Navigation Bar (Zapelite style) */}
          <div className="inline-flex flex-wrap bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-1.5 gap-2 justify-center shadow-inner">
            {(
              [
                { id: 'commerce', label: 'Commerce', icon: ShoppingBag },
                { id: 'marketing', label: 'Marketing Suite', icon: Send },
                { id: 'support', label: 'Support Suite', icon: Headphones },
                { id: 'feedback', label: 'Feedback & Insights', icon: BarChart3 },
                { id: 'intelligence', label: 'Intelligence', icon: Bot },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer',
                    isActive
                      ? 'bg-white text-[#222222] shadow-md scale-102'
                      : 'text-[#555555] hover:text-[#222222]'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#0066FF]' : 'text-[#777777]')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Showcase Card */}
          <div className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-t from-[#1C2199]/[0.03] to-white shadow-zap-md p-8 sm:p-12 text-left grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0066FF] font-mono">
                Product Suite • {productSuites[activeTab].title}
              </span>
              <h3 className="text-3xl font-bold text-[#222222] tracking-tight">
                {productSuites[activeTab].title}
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                {productSuites[activeTab].description}
              </p>

              <div className="space-y-3 pt-2">
                {productSuites[activeTab].features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm font-medium text-[#222222]">{feat}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link href="/dashboard" className="gradient-button px-6 py-2.5 rounded-md text-sm font-semibold">
                  Experience {productSuites[activeTab].title}
                </Link>
                <Link href="/campaigns" className="text-xs font-semibold text-[#0066FF] hover:underline">
                  View Template Library &rarr;
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-[#222222]">
                      {productSuites[activeTab].previewHeadline}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Meta v18.0</span>
                </div>

                <div className="space-y-2 text-xs text-[#555555]">
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    &quot;Hi Julian, your reservation for the AURA Private Drop is confirmed. Tap below to access your VIP credentials.&quot;
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <button className="w-full py-2 bg-blue-50 border border-blue-200 text-[#0066FF] font-medium rounded-lg text-center">
                      [Product Specs]
                    </button>
                    <button className="w-full py-2 bg-blue-50 border border-blue-200 text-[#0066FF] font-medium rounded-lg text-center">
                      [Pricing & Availability]
                    </button>
                    <button className="w-full py-2 bg-blue-50 border border-blue-200 text-[#0066FF] font-medium rounded-lg text-center">
                      [Talk to Dedicated Agent]
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTEGRATION ECOSYSTEM HUB (#integrations) */}
      <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white border-t border-[#E5E7EB] text-center">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
              Works with Your Favorite <span className="gradient-heading font-bold">Tools</span>
            </h2>
            <p className="text-base text-[#555555] max-w-lg mx-auto">
              Connect Zapelite with platforms you already use.
            </p>
          </div>

          {/* Radial Hub Display */}
          <div className="relative w-full max-w-2xl mx-auto py-12 flex flex-col items-center justify-center">
            {/* Center Logo */}
            <div className="w-28 h-28 rounded-2xl bg-white shadow-2xl border-4 border-[#F3F4F6] flex flex-col items-center justify-center z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white shadow-zap-btn">
                <Sparkles className="w-7 h-7 fill-current" />
              </div>
              <span className="text-xs font-bold text-[#222222] mt-1">ZapElite</span>
            </div>

            {/* Orbiting Satellite Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-10">
              {integrations.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-3 justify-center"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-[#222222]">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER: "Need Help? Zapelite is Just a Message Away" */}
      <section className="my-12 px-4 sm:px-6 lg:px-16 xl:px-24">
        <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#0b2947] via-[#081f36] to-[#020d18] text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00C6FF]/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl mx-auto leading-snug">
            Need Help? Zapelite is Just a Message Away
          </h2>

          <p className="text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            The Zapelite team is here to answer your questions, guide you through setup, or help you choose the right plan all in real time.
          </p>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="gradient-button text-base px-8 py-3.5 rounded-md font-semibold inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Start Live Chat Console</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. GET IN TOUCH & CONTACT SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
                Get in <span className="gradient-heading font-bold">Touch</span>
              </h2>
              <p className="text-sm text-[#555555]">
                Have questions or need support? Fill out the form and our team will get back to you shortly.
              </p>
            </div>

            <div className="space-y-3 text-sm text-[#555555]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span>+971 56 121 1011 (WhatsApp Hotline)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>support@zapelite.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Dubai, United Arab Emirates</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 shadow-zap-md space-y-4">
            <h3 className="text-lg font-bold text-[#222222]">Send a Direct Inquiry</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Inquiry received! Our team will WhatsApp you.'); }} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full h-11 rounded-md border border-[#E5E7EB] px-3.5 text-sm focus:outline-none focus:border-[#0066FF]"
              />
              <input
                type="email"
                required
                placeholder="Corporate Email"
                className="w-full h-11 rounded-md border border-[#E5E7EB] px-3.5 text-sm focus:outline-none focus:border-[#0066FF]"
              />
              <input
                type="text"
                placeholder="Company Name (optional)"
                className="w-full h-11 rounded-md border border-[#E5E7EB] px-3.5 text-sm focus:outline-none focus:border-[#0066FF]"
              />
              <textarea
                rows={3}
                placeholder="Describe your messaging requirements..."
                className="w-full rounded-md border border-[#E5E7EB] p-3 text-sm focus:outline-none focus:border-[#0066FF]"
              />
              <button type="submit" className="gradient-button w-full py-3 rounded-md text-sm font-semibold">
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 9. ZAPELITE 5-COLUMN FOOTER */}
      <footer className="bg-[#FAFAFA] border-t border-[#E5E7EB] py-16 px-4 sm:px-6 lg:px-16 xl:px-24 text-xs text-[#555555]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0066FF] to-[#00C6FF] flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <span className="text-lg font-bold text-[#222222]">ZapElite</span>
              </div>
              <p className="text-xs text-[#777777] max-w-sm leading-relaxed">
                Enterprise B2B & B2C Communication and Workflow Automation Platform for WhatsApp Business Cloud API.
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-semibold text-[#222222] text-sm">Quick Links</h4>
              <ul className="space-y-1.5 text-[#555555]">
                <li><Link href="/" className="hover:text-[#0066FF]">Home</Link></li>
                <li><a href="#products" className="hover:text-[#0066FF]">Products</a></li>
                <li><a href="#solutions" className="hover:text-[#0066FF]">Solutions</a></li>
                <li><a href="#integrations" className="hover:text-[#0066FF]">Integrations</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-semibold text-[#222222] text-sm">Explore</h4>
              <ul className="space-y-1.5 text-[#555555]">
                <li><Link href="/campaigns" className="hover:text-[#0066FF]">Bulk Broadcast</Link></li>
                <li><Link href="/automations" className="hover:text-[#0066FF]">Conditional Flow</Link></li>
                <li><Link href="/settings" className="hover:text-[#0066FF]">API & Webhooks</Link></li>
                <li><Link href="/dashboard" className="hover:text-[#0066FF]">Team Inbox</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-semibold text-[#222222] text-sm">Legal & Compliance</h4>
              <ul className="space-y-1.5 text-[#555555]">
                <li><a href="#" className="hover:text-[#0066FF]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#0066FF]">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#0066FF]">Meta Platform Terms</a></li>
                <li><a href="#" className="hover:text-[#0066FF]">Data Protection (GDPR)</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[#777777]">
            <p>© 2025-2026 ZapElite Platform. All rights reserved.</p>
            <p>Powered by Official Meta WhatsApp Cloud API v18.0 & BullMQ Queue</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
