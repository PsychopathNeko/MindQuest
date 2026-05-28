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
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`

for (const scale of indexData.scales) {
  xml += `  <url>
    <loc>${BASE_URL}/scales/${encodeURIComponent(scale.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`
}

xml += `</urlset>
`

// Ensure output dir exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, xml, 'utf-8')
console.log(`Sitemap generated with ${indexData.scales.length + 1} URLs at ${outputPath}`)
