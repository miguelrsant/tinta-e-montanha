import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativo: o build funciona na raiz do domínio ou em qualquer subpasta
export default defineConfig({
  base: './',
  plugins: [react()],
})
