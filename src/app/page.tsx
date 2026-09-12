'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Users,
  Inbox,
  BarChart3,
  Send,
  MessageSquare,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  PhoneCall,
  Clock,
  Layers,
  ShoppingBag,
  Megaphone,
} from 'lucide-react';
import { PhoneMockup } from '@/components/PhoneMockup';
import PassionFruitLogo from '@/components/PassionFruitLogo';

export default function PassionFruitLandingPage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const capabilities = [
    { name: 'Integrations', icon: Globe, href: '/settings' },
    { name: 'Audience CRM', icon: Users, href: '/contacts' },
    { name: 'Team Inbox', icon: Inbox, href: '/dashboard#team-inbox' },
    { name: 'CTWA Ads', icon: Megaphone, href: '/dashboard#ctwa' },
    { name: 'Bulk Broadcast', icon: Send, href: '/campaigns' },
    { name: 'Live Chat', icon: MessageSquare, href: '/dashboard#team-inbox' },
    { name: 'No-Code Bot', icon: Bot, href: '/automations' },
    { name: 'Wati AI', icon: Sparkles, href: '/automations' },
  ];

  const industrySolutions = [
    {
      title: 'Real Estate & Luxury Villas',
      desc: 'Qualify high-net-worth buyers with instant WhatsApp virtual tour lookbooks, location pins, and VIP concierge booking.',
      badge: 'High Ticket',
    },
    {
      title: 'Haute Horlogerie & Fashion',
      desc: 'Send private drop teasers, limited allocation countdowns, and 1-tap private appointments with master watchmakers.',
      badge: 'Exclusive',
    },
    {
      title: 'Travel & Private Aviation',
      desc: 'Deliver real-time flight manifests, yacht charter agreements, and 24/7 client advisor concierge via WhatsApp.',
      badge: 'Hospitality',
    },
    {
      title: 'E-Commerce & Retail Brands',
      desc: 'Recover abandoned carts with 1-tap discount links, automated order shipping alerts, and interactive product catalogs.',
      badge: 'Shopify / WooCommerce',
    },
    {
      title: 'Marketing & Ad Agencies',
      desc: 'Convert Meta Click-to-WhatsApp (CTWA) Instagram & Facebook ads into qualified leads with interactive quick-reply branching.',
      badge: 'CTWA Ads',
    },
    {
      title: 'Healthcare & Private Clinics',
      desc: 'Automate HIPAA-compliant consultation reminders, specialist scheduling, and post-visit treatment care guides.',
      badge: 'Clinics',
    },
    {
      title: 'Automotive & Supercars',
      desc: 'Book VIP test drives, send bespoke vehicle build sheets, and keep car collectors engaged through private VIP broadcasts.',
      badge: 'Automotive',
    },
  ];

  const productSuites = [
    {
      tabName: 'No-Code Chatbots (Wati)',
      headline: 'Visual Drag-and-Drop Chatbot Flow Builder',
      desc: 'Design human-like, multi-branching conversational bots in minutes without writing code. Qualify leads, answer FAQs, and route to human agents.',
      features: [
        'Multi-node visual flowchart with branch conditions',
        'Meta Interactive 3-Button and List Menu replies',
        'Auto-escalate complex inquiries to human agents in Team Inbox',
        'Pre-built templates for Lead Gen, Booking, and Order Lookup',
      ],
      ctaText: 'Explore Chatbot Builder',
      ctaHref: '/automations',
    },
    {
      tabName: 'Shared Team Inbox',
      headline: 'Unified Multi-Agent WhatsApp Support Console',
      desc: 'Empower your sales and customer success teams with a collaborative 2-way inbox. Assign tickets, share internal notes, and speed up resolutions.',
      features: [
        'Wati AI Copilot: Instant conversation summarization',
        'Private Internal Team Notes (invisible to WhatsApp customers)',
        'Canned quick-replies (/pricing, /greeting, /human-agent)',
        'Auto-routing & agent workload distribution',
      ],
      ctaText: 'Open Shared Inbox',
      ctaHref: '/dashboard#team-inbox',
    },
    {
      tabName: 'Meta CTWA Ads Tracker',
      headline: 'Turn Instagram & Facebook Ads into WhatsApp Conversations',
      desc: 'Track Click-to-WhatsApp (CTWA) ad campaigns with granular ROI attribution. Auto-greet ad leads with tailored interactive flows.',
      features: [
        'Live ad attribution tagging (e.g., Summer Drop #4021)',
        'Cost Per Conversation & Return On Ad Spend (ROAS) tracking',
        'Instant automated interactive response within 200ms',
        'Export high-converting lead lists directly to CRM',
      ],
      ctaText: 'View CTWA Analytics',
      ctaHref: '/dashboard#ctwa',
    },
    {
      tabName: 'Broadcasts & Marketing',
      headline: 'High-Throughput Meta Template Campaigns',
      desc: 'Dispatch hyper-personalized WhatsApp broadcasts to thousands of opted-in customers with guaranteed 50ms pacing and zero risk of ban.',
      features: [
        'Meta-approved marketing and notification template library',
        'Dynamic variable substitution ({{name}}, {{item}}, {{link}})',
        'Audience segmentation by customer tags and purchase history',
        'Real-time delivery receipts (sent, delivered, read)',
      ],
      ctaText: 'Create New Campaign',
      ctaHref: '/campaigns',
    },
    {
      tabName: 'WhatsApp Commerce',
      headline: 'WhatsApp Product Catalogs & Cart Checkout',
      desc: 'Showcase products directly inside WhatsApp chat. Enable customers to browse digital catalogs, add items to cart, and checkout seamlessly.',
      features: [
        'Single and multi-product interactive catalog cards',
        'Shopify & WooCommerce automated cart recovery triggers',
        'Instant payment links with Stripe and local gateways',
        'Live inventory sync and back-in-stock alerts',
      ],
      ctaText: 'Explore Commerce',
      ctaHref: '/campaigns',
    },
  ];

  const integrationPartners = [
    { name: 'Shopify', color: '#95BF47' },
    { name: 'HubSpot', color: '#FF7A59' },
    { name: 'Zoho CRM', color: '#E42527' },
    { name: 'Salesforce', color: '#00A1E0' },
    { name: 'WooCommerce', color: '#96588A' },
    { name: 'Stripe', color: '#635BFF' },
    { name: 'Google Sheets', color: '#0F9D58' },
    { name: 'Zapier', color: '#FF4A00' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#222222] font-sans antialiased selection:bg-[#0066FF] selection:text-white">
      {/* 1. FIXED TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-[1650px] mx-auto h-16 px-4 sm:px-6 lg:px-16 xl:px-24 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <PassionFruitLogo size="md" showSubtitle={false} />
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
              Broadcasts
            </Link>
            <Link href="/automations" className="px-3.5 py-2 rounded-md hover:bg-slate-50 hover:text-[#222222] transition-colors">
              Chatbots
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
          <span>OFFICIAL META WHATSAPP CLOUD API • WATI-POWERED AI AUTOMATION</span>
        </div>

        {/* Passion Fruit Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#222222] max-w-5xl leading-[1.2]">
          AI-Powered Customer Engagement & Workflow Automation Platform for{' '}
          <span className="gradient-text-blue font-bold">WhatsApp Business API</span>
        </h1>

        {/* Passion Fruit Description */}
        <p className="text-base sm:text-lg font-normal text-[#555555] max-w-3xl mt-6 leading-relaxed">
          <strong className="text-slate-900">Passion Fruit</strong> combines Meta WhatsApp Cloud API, Wati-style No-Code Visual Chatbots, Shared Multi-Agent Team Inbox, and Meta Click-to-WhatsApp (CTWA) Ads into one high-converting enterprise engine.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className="gradient-button text-base px-8 py-3.5 rounded-md font-semibold">
            Get Started Free
          </Link>
          <a
            href="#solutions"
            className="px-6 py-3.5 bg-white border border-[#E5E7EB] text-[#555555] rounded-md font-semibold text-base hover:bg-[#222222] hover:text-white duration-300 transition shadow-sm"
          >
            View All Solutions
          </a>
        </div>

        {/* 3. PASSION FRUIT 8-CAPABILITY ICON BAR */}
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
                  <div className="w-16 h-16 bg-white border-[3px] border-white p-3.5 rounded-2xl transition-all duration-300 group-hover:bg-blue-50 group-hover:shadow-lg group-hover:scale-110 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#0066FF] group-hover:text-fuchsia-600 transition-colors" />
                  </div>
                  <p className="font-semibold text-[#555555] group-hover:text-[#222222] text-xs text-center transition-colors">
                    {cap.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="w-full max-w-6xl mt-12 rounded-3xl bg-white border border-[#E5E7EB] p-4 sm:p-8 shadow-zap-xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left space-y-4 max-w-md">
              <span className="px-3 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 font-bold text-xs border border-fuchsia-200">
                Wati AI Powered Inbox
              </span>
              <h3 className="text-2xl font-bold text-[#222222] tracking-tight">
                Two-Way Team Conversation Console & Smart Bot Handoff
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                Connect your sales, marketing, and concierge teams. Resolve customer queries with AI summarization, private team notes, and instant template replies.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <Link href="/dashboard" className="gradient-button text-xs px-5 py-2.5 rounded-lg">
                  Explore Live Console
                </Link>
                <Link href="/automations" className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1">
                  Build Bot Flow <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex justify-center scale-90 sm:scale-100">
              <PhoneMockup
                businessName="Passion Fruit Concierge"
                templateName="teaser_alert"
                bodyText="Something big is coming soon. Are you ready?"
                headerText="Passion Fruit Private Showcase"
                footerText="Official WhatsApp Business Verified"
                buttons={[
                  { id: 'b1', title: 'Product Specs' },
                  { id: 'b2', title: 'Pricing' },
                  { id: 'b3', title: 'Talk to Agent' },
                ]}
                showInboundReply={true}
                inboundText="Show me"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. INDUSTRY SOLUTIONS SECTION */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-[#FAFAFA] border-t border-b border-[#E5E7EB]">
        <div className="max-w-[1650px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF]">
                SOLUTIONS BY INDUSTRY
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
                Customized for High-Growth Sectors
              </h2>
            </div>
            <p className="text-sm text-[#555555] max-w-md">
              From high-ticket luxury clienteling to e-commerce cart recovery, Passion Fruit adapts seamlessly to your operational workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {industrySolutions.map((sol, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4 hover:shadow-zap-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-[#0066FF] border border-blue-100">
                    {sol.badge}
                  </span>
                  <h3 className="text-lg font-bold text-[#222222] group-hover:text-[#0066FF] transition-colors">
                    {sol.title}
                  </h3>
                  <p className="text-xs text-[#555555] leading-relaxed">
                    {sol.desc}
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold text-[#0066FF] hover:text-[#00C6FF] flex items-center gap-1.5 pt-2"
                >
                  <span>Launch Template</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SUITES INTERACTIVE TABS */}
      <section id="products" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-[1650px] mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF]">
              PRODUCT CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
              The Complete WhatsApp Business Suite
            </h2>
            <p className="text-sm text-[#555555]">
              Built with the feature depth of Wati and the speed of modern cloud infrastructure.
            </p>
          </div>

          {/* Tabs Navigation Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#E5E7EB] pb-4">
            {productSuites.map((suite, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeTab === i
                    ? 'bg-[#0066FF] text-white shadow-zap-btn'
                    : 'bg-slate-50 text-[#555555] hover:bg-slate-100 hover:text-[#222222]'
                }`}
              >
                {suite.tabName}
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-3xl p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] font-mono">
                  {productSuites[activeTab].tabName}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#222222] leading-snug">
                  {productSuites[activeTab].headline}
                </h3>
                <p className="text-sm text-[#555555] leading-relaxed">
                  {productSuites[activeTab].desc}
                </p>

                <div className="space-y-2.5 pt-2">
                  {productSuites[activeTab].features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0066FF] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[#333333] font-medium leading-relaxed">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href={productSuites[activeTab].ctaHref}
                    className="gradient-button text-xs px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
                  >
                    <span>{productSuites[activeTab].ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-zap-md space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <span className="text-xs font-bold text-[#222222]">Live Feature Matrix</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <div className="space-y-3 text-xs text-[#555555]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Cloud API Latency</span>
                      <strong className="text-slate-900 font-mono">50ms Rate Limit</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Wati AI Copilot</span>
                      <strong className="text-fuchsia-600 font-mono">Enabled</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Meta Webhook Security</span>
                      <strong className="text-emerald-600 font-mono">HMAC SHA-256</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span>Multi-Agent Inbox</span>
                      <strong className="text-blue-600 font-mono">Unlimited Agents</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTEGRATION ORBIT SECTION */}
      <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-16 xl:px-24 bg-[#FAFAFA] border-t border-[#E5E7EB]">
        <div className="max-w-[1650px] mx-auto space-y-12 text-center">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF]">
              SEAMLESS INTEGRATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#222222]">
              Connect Passion Fruit With Your Existing Tech Stack
            </h2>
            <p className="text-sm text-[#555555]">
              Sync contacts, trigger abandoned cart messages, and update deal stages across CRM, eCommerce, and billing platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 max-w-5xl mx-auto">
            {integrationPartners.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#222222]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-16 xl:px-24 bg-gradient-to-r from-[#0066FF] to-[#00C6FF] text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Need Help? Passion Fruit is Just a WhatsApp Away
          </h2>
          <p className="text-base text-blue-50 leading-relaxed max-w-2xl mx-auto">
            Our team is here to answer your questions, guide you through Meta Cloud API verification, or set up custom No-Code chatbot workflows.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-white text-[#0066FF] font-bold rounded-md hover:bg-slate-100 transition shadow-lg text-sm"
            >
              Open Live Console
            </Link>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 bg-[#222222]/20 hover:bg-[#222222]/30 border border-white/30 text-white font-semibold rounded-md transition text-sm flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Concierge</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] py-16 px-4 sm:px-6 lg:px-16 xl:px-24 text-xs text-[#555555]">
        <div className="max-w-[1650px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <PassionFruitLogo size="md" showSubtitle={true} />
            <p className="text-xs text-[#777777] leading-relaxed">
              Enterprise customer engagement platform for Meta WhatsApp Cloud API.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-[#222222] mb-3 uppercase tracking-wider text-[11px]">Solutions</h4>
            <ul className="space-y-2">
              <li><Link href="/automations" className="hover:text-[#0066FF]">No-Code Chatbots</Link></li>
              <li><Link href="/dashboard#team-inbox" className="hover:text-[#0066FF]">Shared Team Inbox</Link></li>
              <li><Link href="/dashboard#ctwa" className="hover:text-[#0066FF]">Click-to-WhatsApp Ads</Link></li>
              <li><Link href="/campaigns" className="hover:text-[#0066FF]">E-Commerce Cart Recovery</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#222222] mb-3 uppercase tracking-wider text-[11px]">Features</h4>
            <ul className="space-y-2">
              <li><Link href="/campaigns" className="hover:text-[#0066FF]">Bulk Broadcasts</Link></li>
              <li><Link href="/contacts" className="hover:text-[#0066FF]">Audience CRM</Link></li>
              <li><Link href="/dashboard#test-lab" className="hover:text-[#0066FF]">Test Scenario Lab</Link></li>
              <li><Link href="/settings" className="hover:text-[#0066FF]">Meta API Settings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-[#222222] mb-3 uppercase tracking-wider text-[11px]">Support & Docs</h4>
            <ul className="space-y-2">
              <li><span className="text-[#222222]">support@passionfruit.io</span></li>
              <li><span>Meta WhatsApp Cloud API v18.0</span></li>
              <li><span>Hostinger BullMQ Worker Cluster</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1650px] mx-auto pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[#777777]">
          <p>© 2025-2026 Passion Fruit Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#222222] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#222222] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#222222] cursor-pointer">Meta Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
