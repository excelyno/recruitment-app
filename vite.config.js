import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    // LOGIKA: 
    // Kalau sedang 'serve' (jalan di localhost), pakai '/' (root)
    // Kalau sedang 'build' (siap deploy), pakai '/recruitment-app/'
    base: command === 'serve' ? '/' : '/recruitment-app/',
  }
  return config
})