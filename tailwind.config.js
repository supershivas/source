// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  future: { hoverOnlyWhenSupported: true },   // pas de :hover collant au toucher (double tap iOS)
  darkMode: 'class',   // ← active le mode sombre via html.dark
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: { mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'] },
    },
  },
  plugins: [],
}
