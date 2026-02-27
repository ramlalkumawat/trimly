import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for provider portal development and production builds.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {}
  }
});
