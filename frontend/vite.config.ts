import { defineConfig, loadEnv } from 'vite'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  // El archivo .env y Compose viven en la raíz del monorepo.
  const env = loadEnv(mode, '..', '')
  Object.assign(process.env, env)

  const useNestBackend = process.env.VITE_USE_NEST_BACKEND === 'true'
  const plugins: PluginOption[] = [react()]
  if (!useNestBackend) {
    const { apiPlugin } = await import('./src/server/apiPlugin')
    plugins.push(apiPlugin())
  }

  return {
    envDir: '..',
    plugins,
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
