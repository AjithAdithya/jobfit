/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a',
          foreground: '#f8fafc',
        },
        accent: {
          DEFAULT: '#3b82f6',
          foreground: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
