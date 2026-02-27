// Tailwind theme tokens for the user app; shared utility classes read these values.
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffcc00',
        'primary-hover': '#e6b800',
        'bg-default': '#ffffff',
        'input-bg': '#f7f7f7',
        'text-primary': '#111'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      boxShadow: {
        soft: '0 6px 18px rgba(16,24,40,0.06)'
      }
    }
  },
  plugins: []
}
