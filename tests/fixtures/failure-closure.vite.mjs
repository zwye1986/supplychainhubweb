import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
const root = process.cwd()
export default defineConfig({
  plugins: [vue()],
  optimizeDeps: { entries: ['tests/fixtures/failure-closure.html'] },
  server: { host: '127.0.0.1', port: 5199 },
  resolve: {
    alias: [
      {
        find: '@/api/order/failure-closure',
        replacement: path.join(root, 'tests/fixtures/failure-closure-api.ts')
      },
      {
        find: '@/directives/permission/hasPermi',
        replacement: path.join(root, 'tests/fixtures/failure-closure-api.ts')
      }
    ]
  }
})
