import { defineConfig } from 'vite';
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  server: { proxy: { '/api': process.env.API_PROXY_TARGET || 'http://localhost:8000' } },
});
