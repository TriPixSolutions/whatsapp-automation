import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AURA | WhatsApp Cloud API Automation for Luxury Brands',
  description:
    'High-throughput WhatsApp broadcast and interactive automation SaaS built for high-ticket lead generation agencies using Meta WhatsApp Cloud API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#07090E] text-zinc-100 antialiased selection:bg-[#D4AF37] selection:text-black">
        {children}
      </body>
    </html>
  );
}
