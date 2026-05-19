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
        'mana-blue': 'rgb(24, 89, 173)',
        'parchment-brown': 'rgb(66, 32, 6)',
        'amber-glow': 'rgb(180, 83, 9)',
        'border-purple': '#4f4288',
        'gold-leaf': '#c9a84c',
        'gold-bright': '#e2c044',
        'dark-vellum': '#2a1a0a',
        'text-parchment': '#f0e6d2',
        'text-gold': '#d4a843',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card-frame': 'inset 0 1px 0 rgba(201, 168, 76, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.5)',
        'card-hover': 'inset 0 1px 0 rgba(201, 168, 76, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.4), 0 4px 16px rgba(201, 168, 76, 0.25)',
        'header-bar': '0 4px 12px rgba(0, 0, 0, 0.6), inset 0 -1px 0 rgba(201, 168, 76, 0.4)',
      },
      keyframes: {
        'subtle-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(201, 168, 76, 0.2)' },
          '50%': { boxShadow: '0 0 16px rgba(201, 168, 76, 0.4)' },
        },
        'card-reveal': {
          '0%': { opacity: '0', transform: 'scale(0.9) rotateY(10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0deg)' },
        },
        'dialog-enter': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'subtle-glow': 'subtle-glow 3s ease-in-out infinite',
        'card-reveal': 'card-reveal 0.4s ease-out forwards',
        'dialog-enter': 'dialog-enter 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
