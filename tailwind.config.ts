import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Official Passion Fruit Brand Color Palette
        pf: {
          midnight: '#0D0F2D', // Primary Dark
          purple: '#7C3AED',   // Accent Purple
          lavender: '#C4B5FD', // Hover / Light Lavender
          green: '#22C55E',    // Success Green
          bg: '#F4F6FB',       // Neutral Background
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        // Legacy compat aliases mapped to new brand palette
        zap: {
          blue: '#7C3AED',     // Replaced with brand purple
          cyan: '#C4B5FD',     // Replaced with brand lavender
          navy: '#0D0F2D',     // Replaced with brand midnight
          dark: '#0D0F2D',
          muted: '#64748B',
          border: '#E2E8F0',
          card: '#F4F6FB',
          accent: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter Tight', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'pf-gradient': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
        'pf-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.12), rgba(244, 246, 251, 0))',
        'zap-gradient': 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
      },
      boxShadow: {
        'pf-btn': '0 4px 14px 0 rgba(124, 58, 237, 0.35)',
        'pf-hover': '0 6px 20px 0 rgba(124, 58, 237, 0.45)',
        'zap-sm': '0 1px 3px 0 rgba(13, 15, 45, 0.05)',
        'zap-md': '0 4px 12px -2px rgba(13, 15, 45, 0.08)',
        'zap-lg': '0 12px 30px -4px rgba(13, 15, 45, 0.10)',
        'zap-btn': '0 4px 14px 0 rgba(124, 58, 237, 0.35)',
        'zap-hover': '0 6px 20px 0 rgba(124, 58, 237, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
