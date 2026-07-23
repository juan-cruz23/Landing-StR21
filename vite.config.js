import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // This is a single static page, not a client-routed SPA, so a missing
  // file should 404 for real — both in the production build and here in
  // dev, where Vite's default SPA history-fallback would otherwise serve
  // index.html (200) for any not-yet-dropped asset and silently defeat the
  // <img> error-based fallback in src/js/media-fallback.js.
  appType: 'mpa',
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: !!process.env.PORT,
  },
});
