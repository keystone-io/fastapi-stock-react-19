import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중 CORS 문제 없이 FastAPI(8000)로 요청을 전달
    proxy: {
      '/samsung': 'http://localhost:8000',
    },
  },
})
