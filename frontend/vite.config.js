import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('\n[PROXY ERROR] Backend non disponible sur localhost:4000')
            console.log('-> Lancez: cd backend && python server.py\n')
          })
        }
      }
    }
  }
})
