import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev/build configuration for the admin frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    'process.env': {}
  }
});
