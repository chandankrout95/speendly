/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#F7F7F2', dark: '#151713' },
        surface: { DEFAULT: '#FFFFFF', dark: '#20231D' },
        ink: { DEFAULT: '#20251F', dark: '#F3F4ED' },
        muted: { DEFAULT: '#737970', dark: '#A4AA9C' },
        line: { DEFAULT: '#E9EAE3', dark: '#34382F' },
        accent: '#6F7F52',
        positive: '#3D8B68',
        warning: '#D69A45',
        danger: '#CF625C',
      },
      borderRadius: { card: '16px' },
    },
  },
  plugins: [],
};
