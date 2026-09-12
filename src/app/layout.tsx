import type { Metadata } from 'next';
import './globals.css';
import { AIChatWidget } from '@/components/AIChatWidget';

export const metadata: Metadata = {
  title: 'Passion fruit | Clean, Modern, Scalable WhatsApp Business SaaS',
  description:
    'Passion fruit: Same energy. Bigger possibilities. AI-powered customer engagement platform with Multi-agent team inbox, no-code visual chatbots, broadcasts, and Meta Click-to-WhatsApp Ads.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F4F6FB] text-[#0D0F2D] antialiased selection:bg-[#7C3AED] selection:text-white font-sans">
        {children}
        <AIChatWidget />
      </body>
    </html>
  );
}
