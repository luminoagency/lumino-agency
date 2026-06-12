import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Lumino brand palette — placeholders, refine during design pass
        brand: {
          50: '#fdf8ed',
          100: '#f9ecca',
          200: '#f3d896',
          300: '#ecbf57',
          400: '#e6a72f',
          500: '#d68d1c',
          600: '#bd6f16',
          700: '#9d5215',
          800: '#804117',
          900: '#6a3616',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
