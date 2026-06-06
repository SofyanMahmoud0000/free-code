import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/free-code/',
  plugins: [react()],
  optimizeDeps: {
    include: ['tldraw'],
  },
})
