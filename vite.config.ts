import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isEmbedMode = process.env.EMBED_MODE === 'true';
  
  return {
    base: mode === 'production' ? '/Nexus-IDE/' : '/',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash]-v437.js`,
          chunkFileNames: `assets/[name]-[hash]-v437.js`,
          assetFileNames: `assets/[name]-[hash]-v437.[ext]`,
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('monaco-editor')) return 'monaco';
              if (id.includes('three') || id.includes('pixi') || id.includes('mermaid')) return 'graphics';
              if (id.includes('xterm')) return 'terminal';
              return 'vendor';
            }
          }
        }
      },
      // Generate web component build for embed mode
      lib: isEmbedMode ? {
        entry: path.resolve(__dirname, 'src/embed.tsx'),
        name: 'NexusIDE',
        fileName: (format) => `nexus-embed.${format}.js`,
        formats: ['es']
      } : undefined,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      headers: {
        // Required for v86 SharedArrayBuffer (x86 emulator)
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    preview: {
      // Ensure correct base path for GitHub Pages deployment testing
      base: '/Nexus-IDE/',
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    optimizeDeps: {
      exclude: ['@xterm/xterm', '@xterm/addon-fit'],
    },
  };
});
