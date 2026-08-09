import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const VERSION = 'v10-' + Date.now().toString(36);

export default defineConfig({
  base: '/photo/',
  plugins: [
    react(),
    {
      name: 'inject-version',
      transformIndexHtml(html) {
        return html.replace('INJECTED_AT_BUILD', VERSION);
      },
    },
  ],
  server: { allowedHosts: true },
  define: {
    '__INKCEPTION_VERSION__': JSON.stringify(VERSION),
  },
})
