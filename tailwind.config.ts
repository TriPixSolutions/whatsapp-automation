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
        obsidian: {
          950: '#04060A',
          900: '#07090E',
          800: '#0B0F17',
          700: '#111622',
          600: '#182030',
          500: '#232D42',
        },
        gold: {
          300: '#F5DEB3',
          400: '#E6C687',
          500: '#D4AF37',
          600: '#AA820A',
        },
        luxury: {
          charcoal: '#12141A',
          glass: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.08)',
          card: 'rgba(11, 15, 23, 0.75)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'luxury-radial': 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
        'subtle-glow': 'radial-gradient(ellipse 60% 40% at 50% -20%, rgba(120, 119, 198, 0.15), rgba(255, 255, 255, 0))',
      },
      boxShadow: {
        'luxury-sm': '0 2px 10px rgba(0, 0, 0, 0.3)',
        'luxury-md': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'luxury-lg': '0 20px 50px rgba(0, 0, 0, 0.7)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
