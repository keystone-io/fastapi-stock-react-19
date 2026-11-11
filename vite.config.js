import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중 CORS 문제 없이 FastAPI 서버로 요청을 전달
    proxy: {
      '/samsung': {
        target: 'http://13.236.45.58',
        changeOrigin: true,
      },
    },
  },
})
