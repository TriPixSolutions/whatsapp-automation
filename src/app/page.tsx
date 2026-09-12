import Link from 'next/link';
import { Sparkles, ArrowRight, Shield, Zap, Send, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07090E] text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background Radial Luxury Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#D4AF37]/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-white/10 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D15] p-[1px] shadow-gold-glow flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F17] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#E6C687]" />
            </div>
          </div>
          <span className="text-sm font-semibold tracking-widest uppercase text-white">AURA PRIVATE</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-xs text-zinc-400 hover:text-white transition-colors tracking-wide"
          >
            Agency Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium tracking-wide transition-all"
          >
            Launch Console
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#E6C687] font-mono tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFICIAL META WHATSAPP CLOUD API • ENTERPRISE SAAS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-tight max-w-4xl mx-auto">
          WhatsApp Automation Engineered for{' '}
          <span className="bg-gradient-to-r from-[#E6C687] via-[#D4AF37] to-[#F5DEB3] bg-clip-text text-transparent italic font-serif">
            Luxury Brands
          </span>{' '}
          & High-Ticket Conversions.
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          High-throughput broadcasts, conversational interactive button automations, and guaranteed delivery via BullMQ + Redis background workers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A035] to-[#99771B] hover:opacity-95 text-black font-semibold text-xs uppercase tracking-widest shadow-gold-glow flex items-center gap-2 transition-all"
          >
            <span>Open Executive Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard#test-lab"
            className="px-6 py-3.5 rounded-xl bg-[#0B0F17] hover:bg-[#111622] border border-white/10 text-xs font-semibold tracking-wider text-zinc-300 flex items-center gap-2 transition-all"
          >
            <span>Run Test Scenario 1 & 2</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-[#0B0F17]/80 border border-white/10 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#E6C687]">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">High-Paced Bulk Worker</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              BullMQ & Redis background engine hosted on Hostinger Cloud, throttled to 50ms to strictly comply with Meta rate limits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F17]/80 border border-white/10 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Instant Interactive Flows</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Vercel edge webhooks trigger immediate 3-button quick reply interactive messages when prospects text keywords like "Show me".
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F17]/80 border border-white/10 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">PostgreSQL & Supabase Auth</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Complete relational ledger with delivery tracking, row-level security, and CSV audience segmentation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} AURA Private Cloud. Built for luxury agencies & high-ticket brands.</p>
      </footer>
    </main>
  );
}
