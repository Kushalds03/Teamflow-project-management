import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
        }
      }
    }
  }
})

