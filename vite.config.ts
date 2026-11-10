import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 배포 주소의 하위 경로. GitHub Pages는 '/<저장소 이름>/'(워크플로가 BASE_PATH로 넘김), Vercel·로컬은 '/'
  base: process.env.BASE_PATH ?? '/',
})
