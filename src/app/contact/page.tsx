import React from 'react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactForm } from '@/components/contact/ContactForm';
import { HomeFaq } from '@/components/home/HomeFaq';

export const metadata = {
  title: 'Contact Sales & Support | AI WhatsApp Platform',
  description: 'Connect with our WhatsApp architecture specialists to scale customer acquisition and support.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#0D0F2D] flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <PublicNav />
      <main className="flex-1">
        <ContactHero />
        <ContactForm />
        <HomeFaq />
      </main>
      <PublicFooter />
    </div>
  );
}
