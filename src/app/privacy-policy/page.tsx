import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileText, Globe, Mail, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Passion Fruit SaaS',
  description: 'Official Privacy Policy and Meta Platform Data Handling Disclosures for Passion Fruit.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#7C3AED] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Meta App Review Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100 text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" />
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Data Protection Policy
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed">
            Last Updated & Effective: September 12, 2026. This policy governs how Passion Fruit (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, stores, processes, and safeguards personal data and Meta Platform data.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* 1. Introduction & Scope */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            1. Overview & Data Controller
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            Passion Fruit provides an enterprise omnichannel shared inbox, customer communication automation, and WhatsApp Cloud API orchestration software platform. When you register for an account, connect your Meta Business accounts, or send/receive communications through our software, we act as both a Data Controller (for your account information) and a Data Processor (for customer conversation data processed on your behalf).
          </p>
        </section>

        {/* 2. Meta Platform Data & Information Collected */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#7C3AED]" />
            2. Meta Platform Data We Collect & Process
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            In compliance with Meta Platform Terms and Developer Policies, Passion Fruit only requests permissions strictly required to provide our messaging and customer support services. Data collected through Meta APIs includes:
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>WhatsApp Account Identifiers:</strong> WABA ID, Phone Number ID, and business display names.</span>
            </li>
            <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Conversation Telemetry:</strong> Inbound message bodies, timestamps, interactive button selections, and delivery status receipts.</span>
            </li>
            <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Customer Contact Details:</strong> Customer WhatsApp phone numbers and sender display profiles.</span>
            </li>
            <li className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Meta Ads Analytics:</strong> Aggregated ad campaign spend, clicks, impressions, and Click-to-WhatsApp conversion metrics.</span>
            </li>
          </ul>
        </section>

        {/* 3. Purpose of Processing */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Purpose of Processing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use collected data solely for the following explicit business purposes:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
            <li>Facilitating bidirectional messaging between your agents and your customers via Meta Cloud API.</li>
            <li>Executing automated workflow triggers, dynamic replies, and chatbot routing configured by your team.</li>
            <li>Providing real-time delivery status receipts (sent, delivered, read, failed) for quality assurance.</li>
            <li>Delivering aggregate dashboard metrics on team response time and ad campaign conversion performance.</li>
            <li><strong>We NEVER sell, monetize, or broker Meta user data or customer conversation contents to third parties or advertising data brokers.</strong></li>
          </ul>
        </section>

        {/* 4. Security & AES-256-GCM Encryption */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#7C3AED]" />
            4. Enterprise Security & Encryption at Rest
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We take data security with extreme rigor. Our security posture includes:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="font-bold text-slate-900 text-sm mb-1">AES-256-GCM</div>
              <div className="text-xs text-slate-600">All Meta System User and Page Access Tokens are encrypted at rest using military-grade AES-256-GCM authenticated encryption.</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="font-bold text-slate-900 text-sm mb-1">HMAC-SHA256</div>
              <div className="text-xs text-slate-600">Inbound webhooks are cryptographically authenticated via x-hub-signature-256 to prevent spoofing.</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="font-bold text-slate-900 text-sm mb-1">Strict RBAC</div>
              <div className="text-xs text-slate-600">Role-Based Access Control blocks unapproved accounts and isolates workspace data completely.</div>
            </div>
          </div>
        </section>

        {/* 5. User Rights & Data Deletion */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Your Privacy Rights & Data Erasure (GDPR / CCPA)</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Depending on your jurisdiction, you have the right to access, rectify, port, or erase personal data held by Passion Fruit. Under the European Union General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you may submit a verifiable request at any time.
          </p>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-900">
            <strong>Need to request data deletion?</strong> You can submit a deletion request directly or track the real-time status of your Meta Platform data deletion via our dedicated{' '}
            <Link href="/data-deletion" className="font-bold underline hover:text-amber-800">
              Data Deletion Request Page
            </Link>.
          </div>
        </section>

        {/* 6. Contact Us */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#7C3AED]" />
            6. Contact & Data Protection Officer
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If you have questions regarding this Privacy Policy, your Meta Platform data, or our compliance protocols, please reach out to our privacy team:
          </p>
          <div className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block">
            <strong>Email:</strong> privacy@passionfruitsaas.com<br />
            <strong>Inquiries:</strong> support@passionfruitsaas.com<br />
            <strong>Response Time:</strong> Within 24-48 business hours
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Passion Fruit Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms-of-service" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/data-deletion" className="hover:text-slate-900 transition-colors">Data Deletion</Link>
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
