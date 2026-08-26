import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages передаёт /WEB-KKR/; локальная и portable-сборки остаются относительными.
  base: process.env.SITE_BASE_PATH || './',
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
