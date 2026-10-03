import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Dev server proxies the API and media to the Python backend (python -m app).
const backend = process.env.VIDOSODEL_BACKEND ?? 'http://127.0.0.1:8765'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': backend, '/media': backend },
  },
  build: { chunkSizeWarningLimit: 1500 },
})
