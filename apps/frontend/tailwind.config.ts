import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './styles/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f6ff',
          100: '#dbe4ff',
          200: '#b6c8ff',
          300: '#8ea8ff',
          400: '#6685ff',
          500: '#3a63ff',
          600: '#274add',
          700: '#1b37aa',
          800: '#132779',
          900: '#0c1a4d'
        }
      }
    }
  },
  plugins: []
};

export default config;
