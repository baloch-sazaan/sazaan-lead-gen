import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#0F0F17',
          elevated: '#15151F',
          border: '#1F1F2E',
        },
        accent: {
          primary: '#6366F1',
          glow: '#818CF8',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#06B6D4',
        },
        text: {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 0 24px rgba(99, 102, 241, 0.4)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.5)',
        'glow-success': '0 0 16px rgba(16, 185, 129, 0.4)',
        'glow-danger': '0 0 16px rgba(239, 68, 68, 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
