import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: mode === 'production' ? '/Nexus-IDE/' : '/',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-v437.js`,
          chunkFileNames: `assets/[name]-[hash]-v437.js`,
          assetFileNames: `assets/[name]-[hash]-v437.[ext]`
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
