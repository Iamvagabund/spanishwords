/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          text: '#ffffff',
          border: '#2d2d2d',
          'card-hover': '#2d2d2d',
          'text-secondary': '#b3b3b3',
          'text-muted': '#808080',
          'bg-secondary': '#1a1a1a',
          'accent': '#3b82f6',
          'accent-hover': '#2563eb',
        }
      }
    },
  },
  plugins: [],
} 