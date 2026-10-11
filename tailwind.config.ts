import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#100d18',
        panel: '#1a1624',
        raised: '#241f31',
        line: '#342d45',
        parchment: '#ece4d2',
        muted: '#a59cb5',
        brass: { DEFAULT: '#c9a227', dim: '#8a7020', bright: '#e8c34f' },
        verdigris: '#5fb3ad',
        wound: '#d0524f',
        paradox: '#b678e0',
        quint: '#5fb3ad',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        hand: ['Caveat', '"Segoe Print"', '"Bradley Hand"', 'cursive'],
        type: ['"Special Elite"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
