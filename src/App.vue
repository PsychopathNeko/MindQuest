<script>
export default {
  onLaunch() {
    console.log('MindQuest App Launch')
    this.updateHtmlLang()
    this.updateTabBarLabels()
  },
  onShow() {
    this.updateHtmlLang()
    this.updateTabBarLabels()
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
