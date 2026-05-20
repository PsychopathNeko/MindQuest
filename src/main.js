import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/global.css'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
