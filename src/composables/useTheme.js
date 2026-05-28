import { ref } from 'vue'

const STORAGE_KEY = 'mindquest_theme'

function getStoredTheme() {
  try {
    const val = uni.getStorageSync(STORAGE_KEY)
    return (val === 'light' || val === 'dark') ? val : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme() {
  try {
    const info = uni.getSystemInfoSync()
    return info.theme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const theme = ref(getStoredTheme())
const resolvedTheme = ref(theme.value === 'system' ? getSystemTheme() : theme.value)

function setTheme(mode) {
  if (mode !== 'system' && mode !== 'light' && mode !== 'dark') return
  theme.value = mode
  resolvedTheme.value = mode === 'system' ? getSystemTheme() : mode
  try {
    uni.setStorageSync(STORAGE_KEY, mode)
  } catch {}
  applyNavBarTheme(resolvedTheme.value)
}

function applyNavBarTheme(resolved) {
  const isDark = resolved === 'dark'
  try {
    uni.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#252033' : '#ffffff',
      animation: { duration: 300, timingFunc: 'easeInOut' }
    })
  } catch {}
  try {
    uni.setTabBarStyle({
      color: isDark ? '#6b6080' : '#8e8e93',
      selectedColor: '#7da2f7',
      backgroundColor: isDark ? '#1a1625' : '#ffffff',
      borderStyle: isDark ? 'black' : 'white',
    })
  } catch {}
}

function cycleTheme() {
  const order = ['system', 'light', 'dark']
  const idx = order.indexOf(theme.value)
  setTheme(order[(idx + 1) % order.length])
}

// Listen for system theme changes
try {
  uni.onThemeChange && uni.onThemeChange((res) => {
    if (theme.value === 'system') {
      resolvedTheme.value = res.theme === 'dark' ? 'dark' : 'light'
      applyNavBarTheme(resolvedTheme.value)
    }
  })
} catch {}

export function useTheme() {
  return { theme, resolvedTheme, setTheme, cycleTheme }
}
