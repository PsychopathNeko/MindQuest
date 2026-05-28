/**
 * Generate sitemap.xml from the scales index.
 * Run: node scripts/generate-sitemap.js
 */
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.SITE_URL || 'https://mindquest.app'
const indexPath = path.join(__dirname, '..', 'src', 'static', 'scales', '_index.json')
const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml')

const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
const today = new Date().toISOString().split('T')[0]

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
  <url>
    <loc>${BASE_URL}/pages/history/index</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`

for (const scale of indexData.scales) {
  xml += `  <url>
    <loc>${BASE_URL}/pages/scale-detail/index?id=${encodeURIComponent(scale.id)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>
`
}

xml += `</urlset>
`

// Ensure output dir exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, xml, 'utf-8')
console.log(`Sitemap generated with ${indexData.scales.length + 2} URLs at ${outputPath}`)
