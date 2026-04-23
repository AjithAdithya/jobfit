/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50:  '#FDECEC',
          100: '#F9D0D0',
          200: '#F1A1A1',
          300: '#E66B6B',
          400: '#D63838',
          500: '#C01414',
          600: '#9C0A0A',
          700: '#7A0707',
          800: '#530303',
          900: '#2E0202',
          ink:  '#1A0000',
        },
        citrus: '#D7FF3A',
        flare:  '#FF4D2E',
        cream:  '#EDE9E3',
        sky:    '#5DD4FF',
        ink: {
          0:   '#FFFFFF',
          50:  '#F5F6F7',
          100: '#E9EBEE',
          200: '#D3D6DB',
          300: '#A9AEB6',
          400: '#7B8088',
          500: '#555A63',
          600: '#3A3E46',
          700: '#24272D',
          800: '#14161B',
          900: '#0A0B0E',
        },
      },
      fontFamily: {
        sans:  ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        chunk: ['"Fjalla One"', 'Poppins', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'tightest': '-0.03em',
        'tighter':  '-0.02em',
        'tight':    '-0.015em',
        'caps':     '0.16em',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
      },
    },
  },
  plugins: [],
}
