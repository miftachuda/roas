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
        pertamina: {
          blue: '#005baa',
          red: '#ed1c24',
          green: '#78be20',
          dark: '#0b132b',
        }
      }
    },
  },
  plugins: [],
}
