import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './popup.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
