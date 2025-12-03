import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// =============================================
// VITE CONFIG - Development & Build
// =============================================

export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  // Sử dụng process.cwd() trực tiếp - Vite config chạy trong Node.js environment
  const env = loadEnv(mode, process.cwd(), '');
  
  // Backend URL cho development proxy
  // Mặc định: http://localhost:3001 (Node.js Express)
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://localhost:3001';

  return {
    plugins: [react()],
    
    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@components': path.resolve(__dirname, './components'),
        '@pages': path.resolve(__dirname, './pages'),
        '@services': path.resolve(__dirname, './services'),
      },
    },

    // Development server config
    server: {
      host: true,        // Listen on all addresses (0.0.0.0)
      port: 3000,        // Frontend dev port
      strictPort: true,  // Fail if port is already in use
      
      // ============= PROXY CONFIG FOR NODE.JS BACKEND =============
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          // Rewrite: /api/materials -> /materials
          // Backend routes không có prefix /api nên cần strip đi
          rewrite: (path) => path.replace(/^\/api/, ''),
          // Log proxy requests trong development
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('➡️  Proxy:', req.method, req.url, '->', BACKEND_URL);
            });
          },
        },
      },
    },

    // Build config
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react'],
          },
        },
      },
    },

    // Environment variables prefix
    envPrefix: 'VITE_',
  };
});
