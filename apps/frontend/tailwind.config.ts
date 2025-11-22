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
          50: '#f3f6fb',
          100: '#d5ddf5',
          200: '#a9b9e5',
          300: '#7a94d3',
          400: '#516fb9',
          500: '#2f4c94',
          600: '#243d79',
          700: '#1c315f',
          800: '#142447',
          900: '#0c162f'
        }
      }
    }
  },
  plugins: []
};

export default config;
