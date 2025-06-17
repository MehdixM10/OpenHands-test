/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ollama-blue': '#0066cc',
        'ollama-dark': '#1a1a1a',
        'ollama-gray': '#2d2d2d'
      }
    },
  },
  plugins: [],
}