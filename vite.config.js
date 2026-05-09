import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // This ensures files in /public are served from root
  base: '/', // Ensures assets are loaded from root
})