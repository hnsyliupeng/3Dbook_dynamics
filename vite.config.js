import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'app',
  plugins: [viteSingleFile()],
  server: { host: '0.0.0.0', allowedHosts: true },
  build: { outDir: '../dist', emptyOutDir: true, assetsInlineLimit: 100000000 },
});
