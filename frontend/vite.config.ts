import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    {
      name: 'spa-app-route-fix',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url) {
            const cleanUrl = req.url.split('?')[0];
            // Prevent Windows case-insensitive filesystem from resolving `/app` to `/App.tsx`
            if (
              cleanUrl === '/app' ||
              cleanUrl === '/app/' ||
              cleanUrl.startsWith('/app/')
            ) {
              req.url = '/index.html';
            }
          }
          next();
        });
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      'lucide-react': path.resolve(__dirname, './components/icons.tsx'),
      recharts: path.resolve(__dirname, './components/recharts-shim.tsx'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});

