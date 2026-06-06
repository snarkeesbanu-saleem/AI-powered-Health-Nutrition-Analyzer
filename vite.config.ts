import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), react()],
  build: {
    rollupOptions: {
      external: [],
    },
  },
  // Important: Make Vite less strict on warnings
  logLevel: 'warn',
  esbuild: {
    logLevel: 'error',
  }
})
