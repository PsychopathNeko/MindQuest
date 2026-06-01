import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './assets/styles/global.css'
import { setLocale } from './composables/useLocale'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior() {
      return { top: 0 }
    },
  },
  ({ router, isClient }) => {
    router.beforeEach((to, from, next) => {
      // Set locale from URL: /en/... = English, otherwise Chinese
      const routeLang = to.params.lang === 'en' ? 'en' : 'zh'
      setLocale(routeLang)

      // Validate scale ID format for routes that require it
      if (['scale-detail', 'assessment', 'report'].includes(to.name)) {
        if (!to.params.id || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(to.params.id)) {
          next({ name: 'home' })
          return
        }
      }
      next()
    })

    if (isClient && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
      })
    }
  },
)
