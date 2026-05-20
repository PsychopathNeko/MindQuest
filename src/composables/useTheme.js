import { ref } from 'vue'

const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'mindquest_theme'

// 'system' | 'light' | 'dark'
const stored = isClient ? localStorage.getItem(STORAGE_KEY) : null
const theme = ref(stored === 'light' || stored === 'dark' ? stored : 'system')

function getSystemTheme() {
  if (!isClient) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode) {
  if (!isClient) return
  const resolved = mode === 'system' ? getSystemTheme() : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

function setTheme(mode) {
  if (mode !== 'system' && mode !== 'light' && mode !== 'dark') return
  theme.value = mode
  if (isClient) localStorage.setItem(STORAGE_KEY, mode)
  applyTheme(mode)
}

function cycleTheme() {
  const order = ['system', 'light', 'dark']
  const idx = order.indexOf(theme.value)
  setTheme(order[(idx + 1) % order.length])
}

// Listen for OS theme changes (only matters when mode is 'system')
if (isClient) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', () => {
    if (theme.value === 'system') applyTheme('system')
  })
}

// Apply on load
applyTheme(theme.value)

export function useTheme() {
  return { theme, setTheme, cycleTheme }
}
