import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:5000';
  const port = parseInt(env.VITE_PORT || '3000', 10);

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-three': ['three'],
            'vendor-maps': ['leaflet'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    },
    server: {
      port,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true
        }
      }
    }
  };
});
