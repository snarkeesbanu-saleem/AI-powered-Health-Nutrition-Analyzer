import { defineConfig } from 'vite'
import tanstackStart from '@tanstack/start/vite'
import vercel from '@tanstack/start-vercel'

export default defineConfig({
  plugins: [
    tanstackStart({
      server: {
        preset: vercel()
      }
    })
  ]
})
