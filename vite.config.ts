import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/kairos-frontend/' : '/',
  // A public build must not inherit this machine's .env.local.
  envDir: mode === 'pages' ? false : undefined,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
}))
