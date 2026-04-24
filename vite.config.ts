import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sqlFilesPlugin } from './src/vite-plugins/sqlFilesPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sqlFilesPlugin()],
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
})
