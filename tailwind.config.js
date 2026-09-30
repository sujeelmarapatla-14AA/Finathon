/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#11120F',          // PRIMARY BACKGROUND
          secondary: '#171813',   // SECONDARY BACKGROUND
          elevated: '#1C1E19',    // ELEVATED SURFACE
          card: '#20221D',        // CARD SURFACE
          hover: '#252720',       // HOVER SURFACE
        },
        text: {
          primary: '#F5F1E8',     // PRIMARY TEXT
          secondary: '#B8B4A9',   // SECONDARY TEXT
          muted: '#77756D',       // MUTED TEXT
        },
        border: {
          DEFAULT: '#30322C',     // BORDER
          subtle: '#272923',      // SUBTLE BORDER
        },
        brand: {
          forest: '#2A6849',       // FOREST GREEN
          'forest-bright': '#3C8A67', // BRIGHT FOREST
          terracotta: '#C8541E',   // TERRACOTTA
          'terracotta-soft': '#D87545', // SOFT TERRACOTTA
          gold: '#A08328',         // ANTIQUE GOLD
          cream: '#FAF7F2',        // WARM CREAM
        },
        status: {
          success: '#4C8B68',
          warning: '#A08328',
          danger: '#C8541E',
          info: '#648A8A',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      letterSpacing: {
        micro: '0.16em',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      },
      boxShadow: {
        fine: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        modal: '0 20px 48px -10px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
}
