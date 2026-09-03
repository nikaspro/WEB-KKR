import { defineConfig } from 'vite';

export default defineConfig({
  // Относительная база позволяет открыть сборку из любой подпапки.
  base: process.env.SITE_BASE_PATH || './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: ['index.html']
    }
  }
});
