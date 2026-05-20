import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import legacy from '@vitejs/plugin-legacy'

// Read scale IDs for SSG pre-rendering
const indexPath = fileURLToPath(new URL('./public/data/scales/_index.json', import.meta.url))
const index = JSON.parse(readFileSync(indexPath, 'utf-8'))
const scaleRoutes = index.scales.map(s => `/scale/${s.id}`)

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/MindQuest/' : '/',
  plugins: [
    vue(),
    vueDevTools(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Chrome >= 52', 'Android >= 5'],
    }),
  ],
  build: {
    target: 'es2018',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  ssgOptions: {
    script: 'async',
    includedRoutes() {
      return ['/', '/history', ...scaleRoutes]
    },
  },
})
