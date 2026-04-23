import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Ajith crimson scale */
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
        /* Accents */
        citrus: '#D7FF3A',
        flare:  '#FF4D2E',
        cream:  '#EDE9E3',
        sky:    '#5DD4FF',
        /* Ink neutrals (warm-cool grey) */
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
      fontSize: {
        'hero':  ['clamp(3.5rem, 9vw, 9rem)',   { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'mega':  ['clamp(2.5rem, 6vw, 5.5rem)', { lineHeight: '1.04', letterSpacing: '-0.025em' }],
        'big':   ['clamp(2rem, 4.5vw, 3.75rem)',{ lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        'tightest': '-0.03em',
        'tighter':  '-0.02em',
        'tight':    '-0.015em',
        'caps':     '0.16em',
      },
      boxShadow: {
        'print-sm':  '0 1px 2px rgba(12,3,64,0.06), 0 1px 0 rgba(12,3,64,0.03)',
        'print-md':  '0 6px 18px -4px rgba(12,3,64,0.10), 0 2px 4px rgba(12,3,64,0.04)',
        'print-lg':  '0 22px 48px -16px rgba(12,3,64,0.22), 0 8px 16px -8px rgba(12,3,64,0.08)',
        'print-xl':  '0 40px 80px -24px rgba(12,3,64,0.35), 0 16px 32px -16px rgba(12,3,64,0.12)',
        'glow':      '0 0 0 1px rgba(192,20,20,0.2), 0 10px 40px -8px rgba(192,20,20,0.55)',
      },
      borderRadius: {
        'xs':  '4px',
        'sm':  '6px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '20px',
        '2xl': '28px',
      },
      transitionTimingFunction: {
        'out-expo':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}

export default config
