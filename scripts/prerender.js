/**
 * Prerender key pages to static HTML for SEO.
 * Run after H5 build: node scripts/prerender.js
 *
 * Generates /pages/scale-detail/index.html with query params embedded
 * as individual HTML files at dist/build/h5/prerendered/{id}.html
 * and also at dist/build/h5/prerendered/scales/{id}/index.html for clean URLs
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const H5_DIR = path.join(__dirname, '..', 'dist', 'build', 'h5')
const INDEX_PATH = path.join(__dirname, '..', 'src', 'static', 'scales', '_index.json')
const OUTPUT_DIR = path.join(H5_DIR, 'prerendered')

async function renderWithRetry(browser, url, selector, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const page = await browser.newPage()
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 })
      await page.waitForSelector(selector, { timeout: 8000 }).catch(() => {})
      const html = await page.content()
      return html
    } catch (err) {
      if (attempt === maxRetries) throw err
      console.warn(`  Retry ${attempt + 1} for ${url}`)
    } finally {
      await page.close()
    }
  }
}

async function prerender() {
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
  const scaleIds = indexData.scales.map(s => s.id)

  console.log(`Prerendering ${scaleIds.length} scale pages + homepage...`)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })

  // Start a simple static server
  const http = require('http')
  const handler = (req, res) => {
    let filePath = path.join(H5_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0])
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(H5_DIR, 'index.html') // SPA fallback
    }
    const ext = path.extname(filePath)
    const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  }
  const server = http.createServer(handler)
  await new Promise(r => server.listen(0, r))
  const port = server.address().port
  const baseUrl = `http://localhost:${port}`

  // Prerender homepage
  const homePage = await browser.newPage()
  try {
    await homePage.goto(`${baseUrl}/`, { waitUntil: 'networkidle0', timeout: 15000 })
    await homePage.waitForSelector('.scale-card', { timeout: 8000 }).catch(() => {})
    const homeHtml = await homePage.content()
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), homeHtml, 'utf-8')
    console.log('  Homepage prerendered')
  } catch (err) {
    console.warn(`  Failed: homepage - ${err.message}`)
  } finally {
    await homePage.close()
  }

  let rendered = 0
  const BATCH_SIZE = 5

  for (let i = 0; i < scaleIds.length; i += BATCH_SIZE) {
    const batch = scaleIds.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (id) => {
      try {
        const url = `${baseUrl}/pages/scale-detail/index?id=${encodeURIComponent(id)}`
        const html = await renderWithRetry(browser, url, '.detail-title')

        // Write flat file (legacy)
        const outFile = path.join(OUTPUT_DIR, `${id}.html`)
        fs.writeFileSync(outFile, html, 'utf-8')

        // Write clean URL directory structure
        const scaleDir = path.join(OUTPUT_DIR, 'scales', id)
        fs.mkdirSync(scaleDir, { recursive: true })
        fs.writeFileSync(path.join(scaleDir, 'index.html'), html, 'utf-8')

        rendered++
        if (rendered % 20 === 0) console.log(`  ${rendered}/${scaleIds.length}`)
      } catch (err) {
        console.warn(`  Failed: ${id} - ${err.message}`)
      }
    }))
  }

  await browser.close()
  server.close()

  console.log(`Done. ${rendered}/${scaleIds.length} pages prerendered to ${OUTPUT_DIR}`)
}

prerender().catch(err => { console.error(err); process.exit(1) })
