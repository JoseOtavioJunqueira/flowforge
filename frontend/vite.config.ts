import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward /api/* to the NestJS backend.
    proxy: { '/api': 'http://localhost:3000' },
  },
})
