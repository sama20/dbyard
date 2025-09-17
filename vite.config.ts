import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths for Electron
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    // Remove proxy config for Electron - we'll use IPC instead
  }
});