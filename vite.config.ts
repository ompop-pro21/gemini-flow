import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to resolve missing cwd method in Process type definition
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows process.env.API_KEY to work in the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});