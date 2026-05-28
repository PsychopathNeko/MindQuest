/**
 * Prepare scale data for uni-app subpackages.
 * Distributes scale JSON files into 3 subpackages and generates
 * static ES module loader files (data.js) for each subpackage.
 */
const fs = require('fs')
const path = require('path')

const SOURCE_DIR = path.resolve(__dirname, '../../testweb/public/data/scales')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(PROJECT_ROOT, 'src')
const STATIC_DIR = path.join(SRC_DIR, 'static', 'scales')

const SUBPACKAGES = {
  'scales-data-a': { min: 'a', max: 'g' },
  'scales-data-b': { min: 'h', max: 'p' },
  'scales-data-c': { min: 'q', max: 'z' },
}

function getSubpackage(filename) {
  const first = filename.charAt(0).toLowerCase()
  for (const [pkg, range] of Object.entries(SUBPACKAGES)) {
    if (first >= range.min && first <= range.max) return pkg
  }
  return 'scales-data-c'
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/** Convert a scale file name to a valid JS identifier */
function toVarName(filename) {
  // e.g. "aaq-ii.en.json" -> "aaq_ii_en"
  return filename
    .replace(/\.json$/, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
}

function main() {
  console.log('Preparing scale data for uni-app subpackages...')
  console.log(`Source: ${SOURCE_DIR}`)

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`)
    process.exit(1)
  }

  // Ensure output directories
  ensureDir(STATIC_DIR)
  for (const pkg of Object.keys(SUBPACKAGES)) {
    ensureDir(path.join(SRC_DIR, pkg))
  }

  // Copy _index.json to static
  const indexSrc = path.join(SOURCE_DIR, '_index.json')
  const indexDst = path.join(STATIC_DIR, '_index.json')
  fs.copyFileSync(indexSrc, indexDst)
  console.log(`Copied _index.json to ${indexDst}`)

  // Copy scale JSON files to subpackages and track per-package files
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json') && f !== '_index.json')
  const pkgFiles = { 'scales-data-a': [], 'scales-data-b': [], 'scales-data-c': [] }

  for (const file of files) {
    const pkg = getSubpackage(file)
    const src = path.join(SOURCE_DIR, file)
    const dst = path.join(SRC_DIR, pkg, file)
    fs.copyFileSync(src, dst)
    pkgFiles[pkg].push(file)
  }

  // Generate data.js loader for each subpackage using ES imports
  for (const [pkg, fileList] of Object.entries(pkgFiles)) {
    const lines = [
      '/**',
      ` * Auto-generated scale data loader for ${pkg}`,
      ' * DO NOT EDIT - run "npm run prepare-scales" to regenerate',
      ' */',
      '',
    ]

    // Group by scale ID and sort
    const scaleMap = {}
    for (const file of fileList) {
      const match = file.match(/^(.+)\.(zh|en)\.json$/)
      if (!match) continue
      const [, scaleId, lang] = match
      if (!scaleMap[scaleId]) scaleMap[scaleId] = {}
      scaleMap[scaleId][lang] = file
    }

    // Generate ES import statements
    const importEntries = []
    for (const [scaleId, langs] of Object.entries(scaleMap).sort()) {
      for (const [lang, file] of Object.entries(langs)) {
        const varName = toVarName(file)
        const key = `${scaleId}.${lang}`
        lines.push(`import ${varName} from './${file}'`)
        importEntries.push({ key, varName })
      }
    }

    lines.push('')
    lines.push('const registry = {')
    for (const { key, varName } of importEntries) {
      lines.push(`  '${key}': ${varName},`)
    }
    lines.push('}')
    lines.push('')
    lines.push('export function getScale(key) {')
    lines.push('  return registry[key] || null')
    lines.push('}')
    lines.push('')

    const loaderPath = path.join(SRC_DIR, pkg, 'data.js')
    fs.writeFileSync(loaderPath, lines.join('\n'))
    console.log(`Generated ${loaderPath} with ${Object.keys(scaleMap).length} scales, ${importEntries.length} entries`)
  }

  // Print distribution stats
  console.log('\nDistribution:')
  for (const [pkg, fileList] of Object.entries(pkgFiles)) {
    const dir = path.join(SRC_DIR, pkg)
    const size = fileList.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(dir, f)).size } catch { return sum }
    }, 0)
    console.log(`  ${pkg}: ${fileList.length} files (${(size / 1024).toFixed(0)} KB)`)
  }

  // Create placeholder page for each subpackage (required by uni-app)
  for (const pkg of Object.keys(SUBPACKAGES)) {
    const pagePath = path.join(SRC_DIR, pkg, 'index.vue')
    fs.writeFileSync(pagePath, '<template><view></view></template>\n<script>export default {}</script>\n')
  }

  console.log('\nDone! Scale data prepared successfully.')
  console.log(`Total: ${files.length} files distributed across 3 subpackages.`)
}

main()
