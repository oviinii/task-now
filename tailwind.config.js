/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0c0a09',
          900: '#141210',
          850: '#1a1714',
          800: '#221e1a',
          700: '#2e2823',
        },
        brass: {
          300: '#f3d38b',
          400: '#e8b64c',
          500: '#d99a2b',
          600: '#b57a1e',
        },
        moss: { 400: '#7fb069', 500: '#5c9a4d' },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -12px rgba(0,0,0,0.6)',
        glow: '0 0 24px -6px rgba(217,154,43,0.45)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 2.2s linear infinite' },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
