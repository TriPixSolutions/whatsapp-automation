import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone Node.js server output for Hostinger Cloud / VPS / PM2
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),

  // Bundle size & cold start optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@supabase/supabase-js',
    ],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },

  serverExternalPackages: ['bullmq', 'ioredis'],

  async headers() {
    return [
      // 1. Static Assets & Chunks (Immutable 1 Year)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // 2. Next.js Optimized Images
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // 3. Dynamic App & API Routes (Strict Cache Bypass)
      {
        source: '/(dashboard|inbox|campaigns|automations|contacts|settings|admin|pending|api)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
      // 4. Global Security Headers
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
