/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#151515',
          black: '#151515',
          deep: '#151515',
          card: '#151515',
          elevated: 'rgba(21, 21, 21, 0.95)',
          border: 'rgba(21, 21, 21, 0.12)',
        },
        surface: {
          DEFAULT: '#F3F3F1',
          white: '#F3F3F1',
          offwhite: '#F3F3F1',
          muted: 'rgba(243, 243, 241, 0.8)',
          subtle: 'rgba(243, 243, 241, 0.6)',
        },
        champagne: {
          DEFAULT: '#B8A47A',
          light: 'rgba(184, 164, 122, 0.18)',
          subtle: 'rgba(184, 164, 122, 0.08)',
          border: 'rgba(184, 164, 122, 0.35)',
          glow: 'rgba(184, 164, 122, 0.25)',
        },
        content: {
          primary: '#151515',
          secondary: 'rgba(21, 21, 21, 0.65)',
          muted: 'rgba(21, 21, 21, 0.45)',
          subtle: 'rgba(21, 21, 21, 0.3)',
          inverse: '#F3F3F1',
          'inverse-muted': 'rgba(243, 243, 241, 0.65)',
        },
        border: {
          DEFAULT: 'rgba(21, 21, 21, 0.1)',
          dark: 'rgba(243, 243, 241, 0.12)',
          muted: 'rgba(21, 21, 21, 0.08)',
          subtle: 'rgba(21, 21, 21, 0.05)',
        },
        accent: {
          DEFAULT: '#B8A47A',
          light: 'rgba(184, 164, 122, 0.2)',
          dark: '#B8A47A',
          mint: 'rgba(184, 164, 122, 0.12)',
        },
        warning: {
          DEFAULT: '#B8A47A',
          soft: 'rgba(184, 164, 122, 0.12)',
        },
        gold: {
          DEFAULT: '#B8A47A',
          soft: 'rgba(184, 164, 122, 0.12)',
        },
        dark: {
          bg: '#151515',
          secondary: 'rgba(21, 21, 21, 0.95)',
          elevated: 'rgba(21, 21, 21, 0.9)',
          card: '#151515',
          hover: 'rgba(21, 21, 21, 0.85)',
        },
        text: {
          primary: '#151515',
          secondary: 'rgba(21, 21, 21, 0.65)',
          muted: 'rgba(21, 21, 21, 0.45)',
        },
        brand: {
          forest: '#151515',
          'forest-bright': '#B8A47A',
          terracotta: '#B8A47A',
          'terracotta-soft': '#B8A47A',
          gold: '#B8A47A',
          cream: '#F3F3F1',
        },
        status: {
          success: '#B8A47A',
          warning: '#B8A47A',
          danger: '#B8A47A',
          info: '#151515',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['12.5px', { lineHeight: '18px' }],
        'xs': ['14px', { lineHeight: '20px' }],
        'sm': ['16px', { lineHeight: '24px' }],
        'base': ['17.5px', { lineHeight: '26px' }],
        'lg': ['19.5px', { lineHeight: '28px' }],
        'xl': ['22px', { lineHeight: '32px' }],
        '2xl': ['26px', { lineHeight: '36px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['40px', { lineHeight: '48px' }],
        '5xl': ['52px', { lineHeight: '60px' }],
        '6xl': ['64px', { lineHeight: '1.1' }],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        micro: '0.14em',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(21, 21, 21, 0.04), 0 1px 2px -1px rgba(21, 21, 21, 0.04)',
        card: '0 4px 20px -2px rgba(21, 21, 21, 0.05), 0 2px 6px -1px rgba(21, 21, 21, 0.03)',
        megamenu: '0 20px 40px -8px rgba(21, 21, 21, 0.12), 0 1px 3px 0 rgba(21, 21, 21, 0.04)',
        float: '0 24px 48px -12px rgba(21, 21, 21, 0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      }
    },
  },
  plugins: [],
}
