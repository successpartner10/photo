import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/photo/',
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
})
