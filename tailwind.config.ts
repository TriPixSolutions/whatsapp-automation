import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic Silicon Valley "American SaaS" Palette (Linear / Vercel style)
        brand: {
          50: '#F5F5FE',
          100: '#ECECFD',
          200: '#D9D9FB',
          300: '#B8B7F8',
          400: '#918FF3',
          500: '#6366F1', // Primary Indigo Accent
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        obsidian: {
          DEFAULT: '#090A0F',
          surface: '#0E1017',
          card: '#131620',
          border: '#1E2333',
          muted: '#8E95A5',
        },
        // Clean high-contrast Light mode tokens
        canvas: {
          DEFAULT: '#FAFAFC',
          card: '#FFFFFF',
          border: '#E4E7EC',
          subtle: '#F4F5F8',
          text: '#0D0F2D',
          muted: '#64748B',
        },
        // Legacy compat aliases mapped cleanly
        pf: {
          midnight: '#090A0F',
          purple: '#6366F1',
          lavender: '#C4B5FD',
          green: '#10B981',
          bg: '#FAFAFC',
          card: '#FFFFFF',
          border: '#E4E7EC',
          muted: '#64748B',
        },
        zap: {
          blue: '#6366F1',
          cyan: '#C4B5FD',
          navy: '#090A0F',
          dark: '#090A0F',
          muted: '#64748B',
          border: '#E4E7EC',
          card: '#FAFAFC',
          accent: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-radial': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%)',
        'glow-card': 'radial-gradient(800px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(99, 102, 241, 0.06), transparent 40%)',
        'pf-gradient': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'pf-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.14), rgba(250, 250, 252, 0))',
        'zap-gradient': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      },
      boxShadow: {
        'pf-btn': '0 4px 14px 0 rgba(99, 102, 241, 0.28)',
        'pf-hover': '0 6px 20px 0 rgba(99, 102, 241, 0.38)',
        'glass-sm': '0 2px 8px -2px rgba(9, 10, 15, 0.05), 0 0 0 1px rgba(9, 10, 15, 0.04)',
        'glass-md': '0 8px 24px -4px rgba(9, 10, 15, 0.06), 0 0 0 1px rgba(9, 10, 15, 0.06)',
        'glass-lg': '0 20px 40px -8px rgba(9, 10, 15, 0.08), 0 0 0 1px rgba(9, 10, 15, 0.08)',
        'glow-primary': '0 0 35px -5px rgba(99, 102, 241, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
