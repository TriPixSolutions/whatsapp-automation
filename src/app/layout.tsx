import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Passion Fruit | AI-Powered WhatsApp Customer Engagement Platform',
  description:
    'Passion Fruit is the enterprise customer engagement platform turning WhatsApp into revenue. Multi-agent team inbox, no-code visual chatbots, bulk broadcasts, and Meta Click-to-WhatsApp Ads.',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAFAFA] text-slate-900 antialiased selection:bg-[#0066FF] selection:text-white">
        {children}
      </body>
    </html>
  );
}
