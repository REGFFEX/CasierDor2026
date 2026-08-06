import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    // Tauri expects a fixed port, fail if that port is not available
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_ENV_PLATFORM', 'TAURI_ENV_ARCH', 'TAURI_ENV_FAMILY', 'TAURI_ENV_PLATFORM_VERSION', 'TAURI_ENV_PLATFORM_TYPE', 'TAURI_ENV_DEBUG'],
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
 
