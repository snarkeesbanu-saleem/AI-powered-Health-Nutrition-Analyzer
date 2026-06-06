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
  // Silence the warning that is being treated as error
  logLevel: 'warn',
})
