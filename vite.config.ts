import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/start/plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tanstackStart(), react()],
})