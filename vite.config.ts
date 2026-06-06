import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), react()],
  build: {
    rollupOptions: {
      // Do not set external here — let TanStack Start handle it
    }
  }
})
