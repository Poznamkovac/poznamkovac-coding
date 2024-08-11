import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import challengeCount from './challenge-count'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), challengeCount()],
})
