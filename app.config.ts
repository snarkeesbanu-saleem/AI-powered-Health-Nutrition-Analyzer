import { defineConfig } from '@tanstack/start/config'
import vercel from '@tanstack/start-vercel'

export default defineConfig({
  server: {
    preset: vercel()
  }
})
