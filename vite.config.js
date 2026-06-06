import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // tldraw uses dynamic imports that need pre-bundling
    include: ['tldraw'],
  },
})
