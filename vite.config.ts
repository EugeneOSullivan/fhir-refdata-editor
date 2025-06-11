import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fhir': {
        target: 'https://hapi.fhir.org/baseR4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fhir/, '')
      }
    }
  }
})
