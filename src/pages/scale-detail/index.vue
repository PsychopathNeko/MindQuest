<template>
  <view :class="['page-detail', resolvedTheme === 'dark' ? 'dark' : '']">
    <view v-if="!ready" class="loading-state">
      <view class="skeleton card" style="height: 200rpx;"></view>
      <view class="skeleton card" style="height: 300rpx; margin-top: 24rpx;"></view>
    </view>

    <view v-else-if="!scale" class="error-state">
      <text class="error-text">{{ t('home.loadError') }}</text>
      <button class="btn btn-primary mt-md" @tap="goHome">{{ t('report.backHome') }}</button>
    </view>

    <scroll-view v-else scroll-y class="detail-content" :style="{ height: contentHeight + 'px' }">
      <view class="detail-header card">
        <!-- #ifdef H5 -->
        <text class="detail-title" role="heading" aria-level="1">{{ scale.meta.name }}</text>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <text class="detail-title">{{ scale.meta.name }}</text>
        <!-- #endif -->
        <text v-if="scale.meta.fullName && scale.meta.fullName !== scale.meta.name" class="detail-fullname">{{ scale.meta.fullName }}</text>
        <text class="detail-desc">{{ scale.meta.description }}</text>
      </view>

      <view class="info-grid">
        <view class="info-item card">
          <text class="info-label">{{ t('detail.questionCount') }}</text>
          <text class="info-value">{{ scale.questions.length }} {{ t('detail.questionUnit') }}</text>
        </view>
        <view class="info-item card">
          <text class="info-label">{{ t('detail.estimatedTime') }}</text>
          <text class="info-value">{{ estimatedMinutes }} {{ t('detail.minutes') }}</text>
        </view>
      </view>

      <view v-if="scale.meta.author" class="info-section card">
        <text class="section-label">{{ t('detail.author') }}</text>
        <text class="section-value">{{ scale.meta.author }}</text>
      </view>

      <view v-if="scale.meta.population" class="info-section card">
        <text class="section-label">{{ t('detail.population') }}</text>
        <text class="section-value">{{ scale.meta.population }}</text>
      </view>

      <view v-if="scale.meta.instruction" class="info-section card">
        <text class="section-label">{{ t('detail.instruction') }}</text>
        <text class="section-value instruction-text">{{ scale.meta.instruction }}</text>
      </view>

      <view v-if="scale.meta.reference" class="info-section card">
        <text class="section-label">{{ t('detail.reference') }}</text>
        <text class="section-value ref-text">{{ scale.meta.reference }}</text>
      </view>

      <!-- Related scales -->
      <view v-if="relatedScales.length" class="related-section">
        <text class="related-title">{{ t('detail.relatedScales') }}</text>
        <view class="related-grid">
          <view
            v-for="rs in relatedScales"
            :key="rs.id"
            class="related-card card"
            @tap="navigateToScale(rs.id)"
          >
            <text class="related-name">{{ rs.name }}</text>
            <text class="related-desc">{{ rs.description }}</text>
            <view class="related-meta">
              <text class="related-tags" v-if="rs.resolvedTags && rs.resolvedTags.length">{{ rs.resolvedTags.slice(0, 2).map(tag => tag.label).join(' · ') }}</text>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 140rpx;"></view>
    </scroll-view>

    <view class="bottom-action safe-bottom">
      <button class="btn btn-primary btn-block btn-start" @tap="startAssessment" :aria-label="t('detail.startAssessment') + ' ' + (scale ? scale.meta.name : '')">
        {{ t('detail.startAssessment') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useScaleLoader } from '../../composables/useScaleLoader'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'

const { loading, loadScale, loadIndex, scales } = useScaleLoader()
const { t } = useLocale()
const { resolvedTheme } = useTheme()

const scale = ref(null)
const scaleId = ref('')
const contentHeight = ref(600)
const ready = ref(false)

const estimatedMinutes = computed(() => {
  if (!scale.value) return '?'
  return Math.max(1, Math.ceil(scale.value.questions.length / 5))
})

const relatedScales = computed(() => {
  if (!scale.value || !scales.value.length) return []
  const currentTags = new Set(scale.value.meta?.tags || [])
  if (currentTags.size === 0) return []
  
  return scales.value
    .filter(s => s.id !== scaleId.value)
    .map(s => {
      const overlap = (s.tags || []).filter(t => currentTags.has(t)).length
      return { ...s, overlap }
    })
    .filter(s => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 4)
})

function goHome() {
  uni.navigateBack()
}

function startAssessment() {
  uni.navigateTo({
    url: `/pages/assessment/index?id=${scaleId.value}`
  })
}

function updatePageMeta(scaleData) {
  // #ifdef H5
  const name = scaleData.meta?.name || ''
  const desc = scaleData.meta?.description || ''
  const author = scaleData.meta?.author || ''
  const qCount = scaleData.questions?.length || 0

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = `${name} - ${desc.slice(0, 150)}`

  // Update OG tags
  const ogTags = { 'og:title': name + ' - MindQuest', 'og:description': desc.slice(0, 200) }
  for (const [prop, content] of Object.entries(ogTags)) {
    let tag = document.querySelector(`meta[property="${prop}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('property', prop)
      document.head.appendChild(tag)
    }
    tag.content = content
  }

  // Update canonical URL
  const cleanUrl = `${window.location.origin}/scales/${scaleId.value}`
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = cleanUrl

  // Update hreflang tags
  const hreflangs = [
    { lang: 'zh-CN', href: `${cleanUrl}?lang=zh` },
    { lang: 'en', href: `${cleanUrl}?lang=en` },
    { lang: 'x-default', href: cleanUrl },
  ]
  hreflangs.forEach(({ lang, href }) => {
    let link = document.querySelector(`link[hreflang="${lang}"]`)
    if (!link) {
      link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = lang
      document.head.appendChild(link)
    }
    link.href = href
  })

  // Inject JSON-LD structured data
  let ldScript = document.getElementById('scale-jsonld')
  if (!ldScript) {
    ldScript = document.createElement('script')
    ldScript.type = 'application/ld+json'
    ldScript.id = 'scale-jsonld'
    document.head.appendChild(ldScript)
  }
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: name + ' - MindQuest',
    description: desc,
    url: `${window.location.origin}/scales/${scaleId.value}`,
    about: {
      '@type': 'MedicalTest',
      name: name,
      description: desc,
    },
    mainEntity: {
      '@type': 'Quiz',
      name: name,
      about: desc,
      educationalAlignment: { '@type': 'AlignmentObject', alignmentType: 'assesses', targetName: 'Mental Health' },
    },
    isPartOf: { '@type': 'WebSite', name: 'MindQuest', url: window.location.origin },
  }
  if (author) jsonLd.author = { '@type': 'Person', name: author }
  ldScript.textContent = JSON.stringify(jsonLd)
  // #endif
}

function navigateToScale(id) {
  uni.navigateTo({
    url: `/pages/scale-detail/index?id=${id}`
  })
}

onLoad((options) => {
  scaleId.value = options.id || ''
  if (scaleId.value) {
    const data = loadScale(scaleId.value)
    if (data) {
      scale.value = data
      uni.setNavigationBarTitle({ title: (data.meta?.name || scaleId.value) + ' - MindQuest' })
      updatePageMeta(data)
    }
  }
  ready.value = true
  loadIndex()
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  contentHeight.value = sysInfo.windowHeight - 20
})
</script>

<style scoped>
.page-detail {
  min-height: 100vh;
  background-color: var(--color-bg);
  position: relative;
}

.detail-content {
  padding: 24rpx 30rpx;
}

.detail-header {
  padding: 32rpx;
}

.detail-title {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 8rpx;
}

.detail-fullname {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 16rpx;
}

.detail-desc {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: block;
  margin-top: 16rpx;
}

.info-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.info-item {
  flex: 1;
  padding: 24rpx;
  text-align: center;
}

.info-label {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
  display: block;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-primary);
}

.info-section {
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
}

.section-label {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
  display: block;
  margin-bottom: 12rpx;
}

.section-value {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.instruction-text {
  background-color: var(--color-surface-alt);
  padding: 20rpx;
  border-radius: var(--radius-md);
  display: block;
}

.ref-text {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  font-style: italic;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 30rpx;
  background-color: var(--color-bg);
  box-shadow: var(--shadow-sm);
}

.btn-start {
  height: 88rpx;
  font-size: var(--font-md);
  border-radius: var(--radius-xl);
}

.loading-state, .error-state {
  padding: 60rpx 30rpx;
}

.error-text {
  display: block;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-base);
}

.related-section {
  margin-top: 24rpx;
}

.related-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.related-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.related-card {
  padding: 20rpx;
  cursor: pointer;
}

.related-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-desc {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.related-meta {
  margin-top: 8rpx;
}

.related-tags {
  font-size: var(--font-xs);
  color: var(--color-primary);
}

@media (max-width: 320px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
