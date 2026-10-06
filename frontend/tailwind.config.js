/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Color Emoji"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', '"Noto Color Emoji"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Semantic surfaces driven by CSS variables (see index.css), so one class works in both themes
        app: 'rgb(var(--app) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        brand: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c9ff',
          300: '#b5a1ff',
          400: '#9470ff',
          500: '#7c4dff',
          600: '#6a2ff5',
          700: '#5a20d9',
          800: '#4a1bb0',
          900: '#3d1a8c',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(15 10 40 / 0.04), 0 8px 24px -8px rgb(15 10 40 / 0.12)',
        lift: '0 2px 4px rgb(15 10 40 / 0.06), 0 18px 40px -12px rgb(15 10 40 / 0.25)',
        glow: '0 10px 40px -10px rgb(124 77 255 / 0.65)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-6px)' },
          '40%,80%': { transform: 'translateX(6px)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pop-in': 'pop-in .25s cubic-bezier(.2,.9,.3,1.3) both',
        shake: 'shake .4s ease-in-out',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
