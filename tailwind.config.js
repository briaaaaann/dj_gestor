/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #7c3aed)',
        accent: 'var(--color-accent, #f59e0b)',
      },
      backgroundImage: {
        'party': 'var(--color-bg, linear-gradient(135deg,#0f0c29,#302b63,#24243e))',
      },
    },
  },
  plugins: [],
};
