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
        zap: {
          blue: '#0066FF',
          cyan: '#00C6FF',
          navy: '#0b2947',
          dark: '#222222',
          muted: '#555555',
          border: '#E5E7EB',
          card: '#FAFAFA',
          accent: '#1C2199',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'zap-gradient': 'linear-gradient(135deg, #0066FF 0%, #00C6FF 100%)',
        'zap-hero': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 102, 255, 0.08), rgba(255, 255, 255, 0))',
      },
      boxShadow: {
        'zap-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'zap-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'zap-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'zap-btn': '0 4px 14px 0 rgba(0, 102, 255, 0.25)',
        'zap-hover': '0 6px 20px 0 rgba(0, 198, 255, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
