/** @type {import('tailwindcss').Config} */
// Tailwind tokens and component-level utility extensions for provider UI.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#18181b',
        'primary-hover': '#27272a',
        'text-primary': '#09090b',
        'input-bg': '#f4f4f5'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      boxShadow: {
        subtle: '0 4px 12px rgba(24, 24, 27, 0.04)',
        card: '0 12px 30px rgba(24, 24, 27, 0.08)'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      }
    }
  },
  plugins: []
};
