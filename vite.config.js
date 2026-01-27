import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // build: {
  //   // Opsi ini memastikan file manifest dan service worker tercopy
  //   // Vite secara default sudah mengcopy isi folder 'public' ke 'dist'
  // },
  server: {
    port: 3000,
  }
})
