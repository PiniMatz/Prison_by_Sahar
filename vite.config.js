import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for assets so it works on GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
