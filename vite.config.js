import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Videogameeee/',
  plugins: [react()],
  build: { manifest: 'asset-manifest.json' },
});
