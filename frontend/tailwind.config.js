/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff5ed',
          100: '#ffe8d6',
          200: '#ffd0b0',
          300: '#ffaf7e',
          400: '#ff8544',
          500: '#ff5c00', // Core Hanumanji Saffron
          600: '#e64a00',
          700: '#be3800',
          800: '#982f07',
          900: '#7b290d',
          950: '#431204',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Rozha One', 'Cinzel', 'serif'],
      },
      boxShadow: {
        'saffron-glow': '0 10px 30px -10px rgba(255, 92, 0, 0.3)',
        'card-hover': '0 20px 40px -15px rgba(230, 74, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
