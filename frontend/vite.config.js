import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: ['moment'], // Excluir moment si está presente
    }
  },
  define: {
    // Deshabilitar warnings de deprecación de moment
    'process.env': {}
  }
})
