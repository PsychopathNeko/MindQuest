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
const enScaleRoutes = index.scales.map(s => `/en/scale/${s.id}`)

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
    includedRoutes() {
      return ['/', '/history', ...scaleRoutes, '/en', '/en/history', ...enScaleRoutes]
    },
    async onFinished() {
      const { writeFileSync, readFileSync } = await import('node:fs')
      // SPA fallback for GitHub Pages (non-prerendered routes like /assessment/:id)
      // Inject noindex to prevent search engines from indexing 404 as duplicate content
      let html404 = readFileSync('dist/index.html', 'utf-8')
      html404 = html404.replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex">')
      writeFileSync('dist/404.html', html404)
      // Sitemap for search engines
      const origin = process.env.GITHUB_ACTIONS
        ? 'https://psychopathneko.github.io/MindQuest'
        : 'https://mindquest-neko.vercel.app'
      const today = new Date().toISOString().slice(0, 10)
      const zhUrls = ['/', '/history', ...scaleRoutes]
      const enUrls = ['/en', '/en/history', ...enScaleRoutes]
      const allUrls = [...zhUrls, ...enUrls]

      function getAlternate(u) {
        const isEn = u.startsWith('/en')
        const base = isEn ? u.replace(/^\/en/, '') || '/' : u
        const zhHref = `${origin}${base}`
        const enHref = `${origin}/en${base === '/' ? '' : base}`
        return { zhHref, enHref }
      }

      const urlEntries = allUrls.map(u => {
        let priority, changefreq
        if (u === '/' || u === '/en') {
          priority = '1.0'
          changefreq = 'weekly'
        } else if (u === '/history' || u === '/en/history') {
          priority = '0.4'
          changefreq = 'weekly'
        } else {
          priority = '0.8'
          changefreq = 'monthly'
        }
        const { zhHref, enHref } = getAlternate(u)
        return [
          '  <url>',
          `    <loc>${origin}${u}</loc>`,
          `    <lastmod>${today}</lastmod>`,
          `    <changefreq>${changefreq}</changefreq>`,
          `    <priority>${priority}</priority>`,
          `    <xhtml:link rel="alternate" hreflang="zh" href="${zhHref}"/>`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${enHref}"/>`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${zhHref}"/>`,
          '  </url>',
        ].join('\n')
      })
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urlEntries,
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
