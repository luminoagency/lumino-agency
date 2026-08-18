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
        /* Scala storica ambra: NON è un placeholder inerte, la usano
           components/ui/button.tsx, il bottone di pagamento in
           /pay/[orderId] e /lumino-admin/orders. Va lasciata com'è:
           il design system nuovo vive sotto il prefisso `lm-`. */
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

        /* Design system Lumino — vetrina studio.
           Prefisso `lm-` per non sovrascrivere le scale native di
           Tailwind (red-500, blue-600, …) usate altrove nell'app. */
        'lm-void': 'var(--void)',
        'lm-void-2': 'var(--void-2)',
        'lm-surface': 'var(--surface)',
        'lm-cream': 'var(--cream)',
        'lm-cream-dim': 'var(--cream-dim)',
        'lm-paper': 'var(--paper)',
        'lm-paper-2': 'var(--paper-2)',
        'lm-ink': 'var(--ink)',
        'lm-ink-dim': 'var(--ink-dim)',
        'lm-red': 'var(--red)',
        'lm-bordeaux': 'var(--bordeaux)',
        'lm-blue': 'var(--blue)',
        'lm-violet': 'var(--violet)',
        'lm-pink': 'var(--pink)',
      },
      borderColor: {
        'lm-line': 'var(--line)',
        'lm-line-ink': 'var(--line-ink)',
      },
      backgroundImage: {
        'lm-grad': 'var(--grad)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
