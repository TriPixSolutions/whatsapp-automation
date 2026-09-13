import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Silence the "multiple lockfiles" workspace root warning
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      // Google profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'googleusercontent.com' },
      // Shopify images
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
  serverExternalPackages: ['bullmq', 'ioredis'],
};

export default nextConfig;
