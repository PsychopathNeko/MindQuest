import { ref, watch } from 'vue'

const STORAGE_KEY = 'mindquest_theme'

// 'system' | 'light' | 'dark'
const stored = localStorage.getItem(STORAGE_KEY)
const theme = ref(stored === 'light' || stored === 'dark' ? stored : 'system')

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

function setTheme(mode) {
  if (mode !== 'system' && mode !== 'light' && mode !== 'dark') return
  theme.value = mode
  localStorage.setItem(STORAGE_KEY, mode)
  applyTheme(mode)
}

function cycleTheme() {
  const order = ['system', 'light', 'dark']
  const idx = order.indexOf(theme.value)
  setTheme(order[(idx + 1) % order.length])
}

// Listen for OS theme changes (only matters when mode is 'system')
const mql = window.matchMedia('(prefers-color-scheme: dark)')
mql.addEventListener('change', () => {
  if (theme.value === 'system') applyTheme('system')
})

// Apply on load
applyTheme(theme.value)

export function useTheme() {
  return { theme, setTheme, cycleTheme }
}
