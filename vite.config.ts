import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { geminiHintPlugin } from './server/vitePlugin'

export default defineConfig({
  plugins: [react(), geminiHintPlugin()],
})
