import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { catalogData } from './scripts/vite-catalog-plugin.mjs';

// base './' keeps asset and data URLs relative, so the site works under /<repo>/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), catalogData()],
  server: { host: '127.0.0.1', port: 5173 },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
