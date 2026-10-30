import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { spawn } from 'child_process';
import http from 'http';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const REQUIRED_MODEL_FILES = [
  { path: 'YuE2_AR/YuE2_AR_int8_convrot.safetensors', name: 'Peso Auto-Regressivo YuE2 AR (Int8)', expectedSize: 2925023698 },
  { path: 'YuE2_AR/qwen.tiktoken', name: 'Tokenizador Qwen Vocab', expectedSize: 2561218 },
  { path: 'YuE2_Acoustic_int8_convrot.safetensors', name: 'Peso Acústico DiT Flow (Int8)', expectedSize: 1522568148 },
  { path: 'yue2/YuE2_VAE_bf16.safetensors', name: 'Decodificador VAE 48kHz Stereo', expectedSize: 132731320 },
  { path: 'yue2/vae_config.json', name: 'Configuração do VAE', expectedSize: 1378 },
  { path: 'sheetsage2/SheetSage2_MERT2_bf16.safetensors', name: 'Modelo SheetSage2 MERT2 (Cover / Harmonia)', expectedSize: 1354429922 }
];

function checkEngineHealth(): Promise<{ online: boolean; data?: any }> {
  return new Promise((resolvePromise) => {
    const req = http.get('http://127.0.0.1:42024/health', { timeout: 1200 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolvePromise({ online: res.statusCode === 200, data: parsed });
        } catch {
          resolvePromise({ online: res.statusCode === 200 });
        }
      });
    });
    req.on('error', () => resolvePromise({ online: false }));
    req.on('timeout', () => {
      req.destroy();
      resolvePromise({ online: false });
    });
  });
}

function checkModelsOnDisk(ckptsDir: string) {
  let installedCount = 0;
  let installedBytes = 0;
  const totalBytes = REQUIRED_MODEL_FILES.reduce((acc, f) => acc + f.expectedSize, 0);
  const missingFiles: any[] = [];
  const installedFiles: any[] = [];

  for (const item of REQUIRED_MODEL_FILES) {
    const fullPath = join(ckptsDir, item.path);
    if (existsSync(fullPath)) {
      try {
        const stats = statSync(fullPath);
        if (stats.size >= item.expectedSize * 0.90) {
          installedCount++;
          installedBytes += stats.size;
          installedFiles.push({ path: item.path, name: item.name, size: stats.size });
          continue;
        }
      } catch (e) {}
    }
    missingFiles.push({ path: item.path, name: item.name, expectedSize: item.expectedSize });
  }

  return {
    installed: installedCount === REQUIRED_MODEL_FILES.length,
    installedCount,
    totalFiles: REQUIRED_MODEL_FILES.length,
    installedBytes,
    totalBytes,
    progress: totalBytes > 0 ? Math.min(1.0, installedBytes / totalBytes) : 0,
    missingFiles,
    installedFiles
  };
}

let activeDownloadProcess: any = null;

function engineManagerPlugin(): Plugin {
  return {
    name: 'iaplay-engine-manager',
    configureServer(server) {
      const rootDir = process.cwd();
      const ckptsDir = resolve(rootDir, 'ckpts');

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // GET /api/engine/status
        if (url === '/api/engine/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const health = await checkEngineHealth();
          const diskStatus = checkModelsOnDisk(ckptsDir);

          return res.end(JSON.stringify({
            running: health.online,
            endpoint: 'http://127.0.0.1:42024',
            engineData: health.data || null,
            models: diskStatus,
            downloading: !!activeDownloadProcess
          }));
        }

        // POST /api/engine/start
        if (url === '/api/engine/start' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          const health = await checkEngineHealth();
          if (health.online) {
            return res.end(JSON.stringify({ ok: true, status: 'already_running', message: 'Motor YuE2 já está em execução na porta 42024.' }));
          }

          let pythonExe = 'python';
          const venvPy = resolve(rootDir, 'env/Scripts/python.exe');
          if (existsSync(venvPy)) {
            pythonExe = venvPy;
          }

          const serverScript = resolve(rootDir, 'server/yue_server.py');
          try {
            const child = spawn(pythonExe, [serverScript, '--port', '42024', '--host', '127.0.0.1'], {
              cwd: rootDir,
              detached: true,
              stdio: 'ignore',
              windowsHide: true,
              env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                PYTHONUTF8: '1'
              }
            });
            child.unref();

            return res.end(JSON.stringify({
              ok: true,
              status: 'starting',
              message: 'Motor YuE2 & SheetSage2 iniciado em segundo plano na porta 42024.'
            }));
          } catch (err: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ ok: false, error: err.message || 'Falha ao iniciar motor YuE2.' }));
          }
        }

        // POST /api/engine/download-and-start
        if (url === '/api/engine/download-and-start' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');

          // 1. Inicia o motor se não estiver rodando
          const health = await checkEngineHealth();
          if (!health.online) {
            let pythonExe = 'python';
            const venvPy = resolve(rootDir, 'env/Scripts/python.exe');
            if (existsSync(venvPy)) pythonExe = venvPy;
            const serverScript = resolve(rootDir, 'server/yue_server.py');

            try {
              const child = spawn(pythonExe, [serverScript, '--port', '42024', '--host', '127.0.0.1'], {
                cwd: rootDir,
                detached: true,
                stdio: 'ignore',
                windowsHide: true,
                env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
              });
              child.unref();
            } catch (e) {}
          }

          // Aguarda um instante para o servidor subir ou inicia o worker direto via yue_server
          setTimeout(() => {
            http.request('http://127.0.0.1:42024/api/v1/models/download', { method: 'POST' }, () => {}).end();
          }, 2000);

          return res.end(JSON.stringify({
            ok: true,
            status: 'started',
            message: 'Iniciando download dos modelos YuE2 3B & SheetSage2 e preparando motor...'
          }));
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), engineManagerPlugin()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:42024',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err: any, _req, res: any) => {
            if (err?.code === 'ECONNREFUSED' && res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Motor YuE2 offline na porta 42024. Inicie o motor pelo painel.' }));
            }
          });
        }
      },
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
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
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
  define: {
    'process.env': {},
    '__APP_VERSION__': JSON.stringify(pkg.version),
  }
});
