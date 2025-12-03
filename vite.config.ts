import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`.
  // Fix lỗi TypeScript 'cwd' bằng cách ép kiểu process
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Mặc định backend chạy ở port 3001 khi dev local (theo docker-compose)
  const BACKEND_URL = env.BACKEND_URL || 'http://localhost:3001';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    server: {
      host: true,
      port: 3000,
      proxy: {
        // Cấu hình Proxy: Chuyển tiếp /api -> Backend
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          // Rewrite: /api/materials -> /materials (nếu backend không có prefix /api)
          // Nếu backend đã có prefix /api, hãy xóa dòng rewrite này.
          rewrite: (path) => path.replace(/^\/api/, ''), 
        }
      }
    }
  };
});