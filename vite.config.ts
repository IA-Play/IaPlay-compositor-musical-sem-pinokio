
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
        secure: true,
        headers: {
          'Origin': 'https://build.nvidia.com',
          'Referer': 'https://build.nvidia.com/'
        }
      },
      '/api/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
        configure: (proxy) => {
          proxy.on('error', (err: any, _req, res: any) => {
            if (err?.code === 'ECONNREFUSED' && res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Ollama offline na porta 11434' }));
            }
          });
        }
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err: any, _req, res: any) => {
            if (err?.code === 'ECONNREFUSED' && res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ offline: true, error: 'Backend PHP opcional offline - operando em modo local' }));
            }
          });
        }
      }
    }
  },
  base: './', // Corrige problemas de carregamento em subdiretórios/previews
  build: {
    outDir: 'dist',
    sourcemap: false, // Desativa sourcemaps em produção para segurança
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Hash garante cache-busting sem precisar do Date.now()
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        }
      }
    }
  },
  // Polyfill simples para evitar que bibliotecas que usam process.env quebrem
  define: {
    'process.env': {},
    '__APP_VERSION__': JSON.stringify(pkg.version),
  }
});
