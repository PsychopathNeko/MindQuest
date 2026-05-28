<script>
import { useLocale } from './composables/useLocale'

export default {
  onLaunch() {
    console.log('MindQuest App Launch')
    // #ifdef H5
    // Respect lang query parameter for SEO
    const urlParams = new URLSearchParams(window.location.search)
    const langParam = urlParams.get('lang')
    if (langParam === 'en' || langParam === 'zh') {
      const { setLocale } = useLocale()
      setLocale(langParam)
    }
    // #endif
    this.updateHtmlLang()
    this.updateTabBarLabels()
    // #ifdef H5
    const locale = uni.getStorageSync('mindquest_locale') || 'zh'
    this.updateSeoMeta(locale)
    // #endif
  },
  onShow() {
    this.updateHtmlLang()
    this.updateTabBarLabels()
    // #ifdef H5
    const locale = uni.getStorageSync('mindquest_locale') || 'zh'
    this.updateSeoMeta(locale)
    // #endif
  },
  onHide() {},
  methods: {
    updateHtmlLang() {
      // #ifdef H5
      try {
        const locale = uni.getStorageSync('mindquest_locale') || 'zh'
        document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN'
      } catch {}
      // #endif
    },
    updateSeoMeta(locale) {
      // #ifdef H5
      // Update og:locale
      let ogLocale = document.querySelector('meta[property="og:locale"]')
      if (ogLocale) {
        ogLocale.content = locale === 'en' ? 'en_US' : 'zh_CN'
      }
      let ogLocaleAlt = document.querySelector('meta[property="og:locale:alternate"]')
      if (ogLocaleAlt) {
        ogLocaleAlt.content = locale === 'en' ? 'zh_CN' : 'en_US'
      }
      // #endif
    },
    updateTabBarLabels() {
      try {
        const locale = uni.getStorageSync('mindquest_locale') || 'zh'
        const labels = locale === 'en'
          ? ['Scales', 'History', 'Me']
          : ['量表库', '历史', '我的']
        labels.forEach((text, index) => {
          uni.setTabBarItem({ index, text })
        })
      } catch {}
    }
  }
}
</script>

<style>
@import './styles/variables.css';
@import './styles/global.css';
</style>
