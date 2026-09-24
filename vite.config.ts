import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { apiPlugin } from './src/server/apiPlugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar TODAS las variables de .env (sin prefijo) hacia process.env para
  // que el pool de PostgreSQL (lado servidor) pueda leerlas.
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  const useNestBackend = process.env.VITE_USE_NEST_BACKEND === 'true'

  return {
    plugins: [react(), ...(useNestBackend ? [] : [apiPlugin()])],
    server: {
      proxy: useNestBackend
        ? {
            '/api': {
              target: process.env.BACKEND_URL || 'http://localhost:3000',
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
