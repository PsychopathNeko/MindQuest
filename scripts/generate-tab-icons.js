/**
 * Generate minimal placeholder tab bar icons (81x81 px).
 * These are single-color 1x1 PNGs scaled - just placeholders.
 * Replace with proper icons before production.
 */
const fs = require('fs')
const path = require('path')

// Minimal 1x1 transparent PNG (base64)
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAADklEQVR42u3BAQEAAACCIP+' +
  'vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwN0GUQABATga8qgAAAAASUVORK5CYII=',
  'base64'
)

// Gray PNG for inactive icons
const GRAY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAAEElEQVR42u3BMQEAAADCoPV' +
  'PbQwfoAAAAAAAAAAAAAAAAHcDHkgAAUGIregAAAAASUVORK5CYII=',
  'base64'
)

const STATIC_DIR = path.resolve(__dirname, '../src/static')

const icons = [
  'tab-home.png',
  'tab-home-active.png',
  'tab-history.png',
  'tab-history-active.png',
  'tab-profile.png',
  'tab-profile-active.png',
]

if (!fs.existsSync(STATIC_DIR)) {
  fs.mkdirSync(STATIC_DIR, { recursive: true })
}

for (const icon of icons) {
  const isActive = icon.includes('active')
  const filePath = path.join(STATIC_DIR, icon)
  fs.writeFileSync(filePath, isActive ? GRAY_PNG : TRANSPARENT_PNG)
  console.log(`Created: ${filePath}`)
}

console.log('Tab icons generated (placeholders).')
