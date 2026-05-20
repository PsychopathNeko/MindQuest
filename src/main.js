import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './assets/styles/global.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior() {
      return { top: 0 }
    },
  },
  ({ router, isClient }) => {
    router.beforeEach((to, from, next) => {
      if (['scale-detail', 'assessment', 'report'].includes(to.name)) {
        if (!to.params.id || to.params.id.trim() === '') {
          next({ name: 'home' })
          return
        }
      }
      next()
    })

    if (isClient && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      })
    }
  },
)
