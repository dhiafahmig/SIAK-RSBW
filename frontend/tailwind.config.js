/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#2563eb'
        },
        secondary: {
          DEFAULT: '#10b981',
          light: '#6ee7b7',
          dark: '#059669' 
        },
        accent: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
          dark: '#d97706'
        },
        background: "#F9FAFB", // Putih abu-abu
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 