import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Scale, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Passion Fruit SaaS',
  description: 'Terms of Service and Acceptable Use Policy for Passion Fruit SaaS.',
};

export default function TermsOfServicePage() {
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Terms & Conditions
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100 text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="w-3.5 h-3.5" />
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service & Acceptable Use Policy
          </h1>
          <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed">
            Effective Date: September 12, 2026. Please read these Terms carefully before using Passion Fruit (&quot;Service&quot;, &quot;Platform&quot;). By creating an account or connecting Meta integrations, you agree to be bound by these Terms.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* 1. Acceptance */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            1. Acceptance of Terms
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            These Terms of Service constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;) and Passion Fruit Inc. If you are registering on behalf of a company, organization, or other entity, you represent and warrant that you have full legal authority to bind that entity to these Terms.
          </p>
        </section>

        {/* 2. Platform Description & Meta Compliance */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
            2. Meta Cloud API & WhatsApp Business Policy Compliance
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Passion Fruit integrates with Meta Platforms Inc. (&quot;Meta&quot;) APIs, including the WhatsApp Business Cloud API and Meta Ads Insights. Your use of Passion Fruit is conditioned upon your strict compliance with:
          </p>
          <ul className="space-y-2 text-sm text-slate-600 pl-4 border-l-2 border-purple-200">
            <li>Meta Commercial Terms and Platform Terms</li>
            <li>WhatsApp Business Messaging Policy (including opt-in requirements)</li>
            <li>WhatsApp Commerce Policy and Community Guidelines</li>
          </ul>
          <p className="text-slate-600 text-sm leading-relaxed">
            You acknowledge that Meta reserves the right to rate-limit, review, or suspend any WhatsApp Business Account (WABA) or phone number that violates Meta messaging policies. Passion Fruit is not liable for sanctions imposed by Meta due to Customer non-compliance.
          </p>
        </section>

        {/* 3. Acceptable Use Policy */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            3. Prohibited Activities
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You agree NOT to use the Platform for any of the following prohibited behaviors:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
              <strong>Spam & Unsolicited Messaging:</strong> Sending WhatsApp broadcasts to recipients who have not provided explicit, verifiable prior opt-in consent.
            </div>
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
              <strong>Deceptive Practices:</strong> Impersonating another person, business, or government agency, or engaging in phishing or fraudulent schemes.
            </div>
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
              <strong>Prohibited Products:</strong> Promoting firearms, prescription medications, illegal substances, or counterfeit goods in violation of Meta policies.
            </div>
            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
              <strong>Reverse Engineering:</strong> Attempting to decompile, reverse-engineer, or probe the vulnerability of Passion Fruit infrastructure without authorization.
            </div>
          </div>
        </section>

        {/* 4. Accounts & RBAC Approval */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Account Onboarding & Role-Based Access Control</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All newly registered accounts undergo review (&quot;pending_approval&quot;) to verify business identity and maintain carrier deliverability standards. Access to live messaging dashboards, broadcast engines, and Meta API tokens is granted exclusively upon verification by our administration team.
          </p>
        </section>

        {/* 5. Limitation of Liability */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. Limitation of Liability</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            To the maximum extent permitted by applicable law, Passion Fruit and its suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or business opportunities arising out of or related to your use of the Service.
          </p>
        </section>

        {/* 6. Governing Law & Contact */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-900">6. Governing Law & Questions</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of Delaware, United States, without regard to conflict of law principles. For legal notices or inquiries regarding these Terms, contact{' '}
            <a href="mailto:legal@passionfruitsaas.com" className="text-[#7C3AED] font-semibold underline">
              legal@passionfruitsaas.com
            </a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Passion Fruit Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/data-deletion" className="hover:text-slate-900 transition-colors">Data Deletion</Link>
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
