/** @type {import('tailwindcss').Config} */
// Tailwind design tokens and utility extensions for admin UI.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffcc00',
        'primary-hover': '#e6b800',
        'text-primary': '#111',
        'input-bg': '#f7f7f7'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.08)'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      }
    }
  },
  plugins: []
};
