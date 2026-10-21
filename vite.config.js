import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativo: funciona no GitHub Pages (/tinta-e-montanha/) e em qualquer subpasta
export default defineConfig({
  base: './',
  plugins: [react()],
})
