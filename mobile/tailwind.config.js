/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          soft: '#CCFBF1',
          dark: '#115E59',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          soft: '#FEF3C7',
        },
        success: {
          DEFAULT: '#22C55E',
          soft: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F97316',
          soft: '#FFEDD5',
        },
        error: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
        },
        background: '#F0FDFA',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#134E4A',
          muted: '#5F8A85',
          light: '#99B8B4',
        },
      },
      borderRadius: {
        card: '24px',
        button: '20px',
      },
    },
  },
  plugins: [],
};
