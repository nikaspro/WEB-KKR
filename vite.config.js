import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // По умолчанию Vite инлайнит ассеты до 4 КБ в base64, а гейт валит data: длиннее 2 КБ.
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: 'index.html'
    }
  }
});
