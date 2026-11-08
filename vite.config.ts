import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // [3D 분자 도감] 청크(three.js + @react-three/*, 약 1MB)는 React.lazy로 해당 탭을 열 때만 로드된다.
    // three 계열을 수동으로 쪼개면 공유 의존성 때문에 첫 화면에서 preload되므로 분할하지 않고 기준만 조정한다.
    chunkSizeWarningLimit: 1100,
  },
})
