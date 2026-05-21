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
    process.env.NODE_ENV !== 'production' && vueDevTools(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Chrome >= 52', 'Android >= 5'],
    }),
  ].filter(Boolean),
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
    async onFinished() {
      const { writeFileSync, copyFileSync } = await import('node:fs')
      // SPA fallback for GitHub Pages (non-prerendered routes like /assessment/:id)
      copyFileSync('dist/index.html', 'dist/404.html')
      // Sitemap for search engines
      const origin = 'https://psychopathneko.github.io/MindQuest'
      const urls = ['/', '/history', ...scaleRoutes]
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(u => `  <url><loc>${origin}${u}</loc></url>`),
        '</urlset>',
      ].join('\n')
      writeFileSync('dist/sitemap.xml', sitemap)
      writeFileSync('dist/robots.txt', `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`)
    },
  },
})
