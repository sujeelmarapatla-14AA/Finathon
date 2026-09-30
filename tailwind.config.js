/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          white: '#FFFFFF',
          offwhite: '#FAFAF8',
          muted: '#F5F5F2',
          subtle: '#EEEEEC',
        },
        ink: {
          black: '#050505',
          deep: '#0A0A0A',
          card: '#111111',
          elevated: '#171717',
          border: '#222222',
        },
        content: {
          primary: '#111111',
          secondary: '#5E5E5A',
          muted: '#8A8A84',
          subtle: '#A9A9A4',
          inverse: '#FFFFFF',
          'inverse-muted': '#B8B8B2',
        },
        border: {
          DEFAULT: '#E8E8E3',
          dark: '#222222',
          muted: '#DCDCD7',
          subtle: '#F0F0EB',
        },
        accent: {
          DEFAULT: '#73C69A',
          light: '#A9E8C1',
          dark: '#2A6849',
          mint: '#D8F3E5',
        },
        warning: {
          DEFAULT: '#D96B4A',
          soft: '#FDEEE9',
        },
        gold: {
          DEFAULT: '#B6A35A',
          soft: '#F8F5E9',
        },
        // Backwards compatibility tokens
        dark: {
          bg: '#0A0A0A',
          secondary: '#111111',
          elevated: '#171717',
          card: '#141414',
          hover: '#1F1F1F',
        },
        text: {
          primary: '#111111',
          secondary: '#5E5E5A',
          muted: '#8A8A84',
        },
        brand: {
          forest: '#2A6849',
          'forest-bright': '#73C69A',
          terracotta: '#D96B4A',
          'terracotta-soft': '#E68565',
          gold: '#B6A35A',
          cream: '#FAFAF8',
        },
        status: {
          success: '#73C69A',
          warning: '#B6A35A',
          danger: '#D96B4A',
          info: '#5B8C85',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['11.5px', { lineHeight: '16px' }],
        'xs': ['13px', { lineHeight: '18px' }],
        'sm': ['15px', { lineHeight: '22px' }],
        'base': ['16.5px', { lineHeight: '25px' }],
        'lg': ['18.5px', { lineHeight: '27px' }],
        'xl': ['21px', { lineHeight: '30px' }],
        '2xl': ['25px', { lineHeight: '34px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['38px', { lineHeight: '46px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
        '6xl': ['60px', { lineHeight: '1.1' }],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        micro: '0.14em',
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        megamenu: '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        float: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
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
