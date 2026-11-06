import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#141413',
        'dark-warm': '#1c1814',
        'dark-mid': '#241e18',
        'surf-1': '#2e251d',
        'surf-2': '#3a2e24',
        'surf-3': '#4a3b2e',
        cream: '#f5f0e8',
        'mid-gray': '#b0aea5',
        'text-faint': '#7a6e64',
        orange: '#d97757',
        mustard: '#c8933a',
        brown: '#8b6347',
        positive: '#a8c47a',
        negative: '#d97757',
        voter: '#c8933a',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        body: ['var(--font-roboto)', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '60%':  { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
