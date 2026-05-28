<template>
  <view :class="['page-assess', resolvedTheme === 'dark' ? 'dark' : '']">
    <!-- Custom nav bar (navigationStyle: custom) -->
    <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-back" @tap="handleExit">&#x2715;</text>
        <text class="nav-title">{{ scaleName }}</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>

    <view v-if="!scale" class="loading-state">
      <text>{{ t('home.loading') }}</text>
    </view>

    <view v-else class="assess-body">
      <!-- Draft restore banner -->
      <view v-if="showDraftBanner" class="draft-banner">
        <text class="draft-text">{{ t('assess.draftFound') }}</text>
        <view class="draft-actions">
          <button class="btn btn-primary btn-sm" @tap="handleRestoreDraft">{{ t('assess.restoreDraft') }}</button>
          <button class="btn btn-outline btn-sm" @tap="handleDiscardDraft">{{ t('assess.discardDraft') }}</button>
        </view>
      </view>

      <!-- Progress bar -->
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">{{ t('assess.questionNumber', { current: currentIndex + 1, total: progress.total }) }}</text>
      </view>

      <!-- Question area -->
      <!-- #ifdef H5 -->
      <view class="question-area" role="group" :aria-label="currentQuestion && currentQuestion.text">
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <view class="question-area">
      <!-- #endif -->
        <text class="question-text">{{ currentQuestion && currentQuestion.text }}</text>
      </view>

      <!-- Choices -->
      <!-- #ifdef H5 -->
      <view class="choices-area" role="radiogroup">
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <view class="choices-area">
      <!-- #endif -->
        <view
          v-for="choice in currentChoices"
          :key="choice.value"
          :class="['choice-item', answers[currentIndex] === choice.value ? 'choice-selected' : '']"
          @tap="handleSelect(choice.value)"
        >
          <view class="choice-radio">
            <view v-if="answers[currentIndex] === choice.value" class="radio-dot"></view>
          </view>
          <text class="choice-label">{{ choice.label }}</text>
        </view>
      </view>

      <!-- Navigation buttons -->
      <view class="nav-buttons">
        <button
          class="btn btn-outline nav-btn"
          :disabled="!canGoBack"
          @tap="goPrev"
        >{{ t('assess.prev') }}</button>

        <button
          v-if="!isComplete"
          class="btn btn-primary nav-btn"
          :disabled="!canGoForward"
          @tap="goNext"
        >{{ t('assess.next') }}</button>

        <button
          v-else
          class="btn btn-primary nav-btn btn-results"
          @tap="submitAssessment"
        >{{ t('assess.viewResults') }}</button>
      </view>

      <!-- Question dots / mini-map -->
      <scroll-view class="dots-scroll" scroll-x enable-flex>
        <view class="dots-wrap">
          <view
            v-for="(q, idx) in questions"
            :key="idx"
            :class="['dot', idx === currentIndex ? 'dot-current' : '', answers[idx] !== undefined ? 'dot-answered' : '']"
            @tap="goTo(idx)"
          ></view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useScaleLoader } from '../../composables/useScaleLoader'
import { useAssessment } from '../../composables/useAssessment'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'
import { saveAssessment, getDraft, clearDraft } from '../../utils/storage'

const { loadScale } = useScaleLoader()
const { t } = useLocale()
const { resolvedTheme } = useTheme()

const scale = ref(null)
const scaleId = ref('')
const scaleName = ref('')
const statusBarHeight = ref(44)
const showDraftBanner = ref(false)
const draftData = ref(null)

const {
  currentIndex,
  answers,
  isComplete,
  progress,
  currentQuestion,
  canGoBack,
  canGoForward,
  selectAnswer,
  goNext,
  goPrev,
  goTo,
  getResults,
  cleanup,
  restoreDraft,
} = useAssessment(scale, scaleId)

const questions = computed(() => scale.value?.questions ?? [])

const currentChoices = computed(() => {
  if (!scale.value || !currentQuestion.value) return []
  // Use question-specific choices or commonChoices
  return currentQuestion.value.choices || scale.value.commonChoices || []
})

const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.current / progress.value.total) * 100)
})

function handleSelect(value) {
  uni.vibrateShort({ type: 'light' })
  selectAnswer(value)
}

function handleExit() {
  uni.showModal({
    title: t('assess.exitTitle'),
    content: t('assess.confirmExit'),
    success(res) {
      if (res.confirm) {
        uni.navigateBack()
      }
    }
  })
}

function handleRestoreDraft() {
  if (draftData.value) {
    restoreDraft(draftData.value)
  }
  showDraftBanner.value = false
  draftData.value = null
}

function handleDiscardDraft() {
  clearDraft(scaleId.value)
  showDraftBanner.value = false
  draftData.value = null
}

function updateAssessmentMeta() {
  // #ifdef H5
  if (!scale.value) return
  const name = scale.value.meta?.name || ''
  const desc = scale.value.meta?.description || ''
  const qCount = scale.value.questions?.length || 0

  // Update document title (actual <title> tag)
  document.title = `${name} - MindQuest`

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = `${name} - ${desc.slice(0, 120)}`

  // Update canonical
  const cleanUrl = `${window.location.origin}/assessments/${scaleId.value}`
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = cleanUrl

  // OG tags for assessment
  const ogUpdates = {
    'og:title': `${name} - MindQuest`,
    'og:description': desc.slice(0, 200),
    'og:url': cleanUrl,
  }
  for (const [prop, content] of Object.entries(ogUpdates)) {
    let tag = document.querySelector(`meta[property="${prop}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('property', prop)
      document.head.appendChild(tag)
    }
    tag.content = content
  }

  // hreflang
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

  // Assessment pages are transient - noindex
  let robotsMeta = document.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    document.head.appendChild(robotsMeta)
  }
  robotsMeta.content = 'noindex, follow'

  // Inject JSON-LD
  let ldScript = document.getElementById('assessment-jsonld')
  if (!ldScript) {
    ldScript = document.createElement('script')
    ldScript.type = 'application/ld+json'
    ldScript.id = 'assessment-jsonld'
    document.head.appendChild(ldScript)
  }
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${name} - MindQuest`,
    description: desc,
    url: cleanUrl,
    numberOfQuestions: qCount,
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'assesses',
      targetName: 'Mental Health',
    },
    isPartOf: { '@type': 'WebSite', name: 'MindQuest', url: window.location.origin },
  })
  // #endif
}

function submitAssessment() {
  const results = getResults()
  // Extract chart configuration from scale data
  const scaleReport = scale.value && scale.value.report ? scale.value.report : {}
  const chartConfig = {
    charts: scaleReport.charts || ['gauge'],
    gaugeConfig: scaleReport.gaugeConfig || null,
    barConfig: scaleReport.barConfig || null,
    radarConfig: scaleReport.radarConfig || null,
  }
  const record = {
    scaleId: scaleId.value,
    scaleName: scaleName.value,
    timestamp: Date.now(),
    answers: results.answers,
    scores: results.scores,
    report: results.report,
    chartConfig,
  }
  const key = saveAssessment(record)
  clearDraft(scaleId.value)
  uni.redirectTo({
    url: `/pages/report/index?key=${encodeURIComponent(key)}`
  })
}

onLoad((options) => {
  scaleId.value = options.id || ''
  if (scaleId.value) {
    const data = loadScale(scaleId.value)
    if (data) {
      scale.value = data
      scaleName.value = data.meta?.name || scaleId.value
      uni.setNavigationBarTitle({ title: scaleName.value + ' - MindQuest' })
      updateAssessmentMeta()
      // Check for saved draft
      const draft = getDraft(scaleId.value)
      if (draft && draft.questionCount === data.questions.length && Object.keys(draft.answers || {}).length > 0) {
        draftData.value = draft
        showDraftBanner.value = true
      }
    }
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.page-assess {
  min-height: 100vh;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.custom-nav {
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
}

.nav-back {
  font-size: 36rpx;
  color: var(--color-text-secondary);
  padding: 10rpx;
  width: 60rpx;
}

.nav-title {
  font-size: var(--font-md);
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-placeholder {
  width: 60rpx;
}

.assess-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 30rpx;
}

.progress-wrap {
  margin-bottom: 40rpx;
}

.progress-bar {
  height: 8rpx;
  background-color: var(--color-border);
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.progress-text {
  display: block;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
  margin-top: 12rpx;
}

.question-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  min-height: 160rpx;
}

.question-text {
  font-size: var(--font-lg);
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.6;
}

.choices-area {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.choice-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 2rpx solid var(--color-border);
  transition: all 0.2s;
}

.choice-item:active {
  transform: scale(0.98);
}

.choice-selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-bg);
}

.choice-radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.choice-selected .choice-radio {
  border-color: var(--color-primary);
}

.radio-dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background-color: var(--color-primary);
}

.choice-label {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  line-height: 1.4;
}

.nav-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.nav-btn {
  flex: 1;
  height: 80rpx;
}

.btn-results {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
}

.dots-scroll {
  white-space: nowrap;
  padding-bottom: 20rpx;
}

.dots-wrap {
  display: flex;
  justify-content: center;
  gap: 10rpx;
  flex-wrap: wrap;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: var(--color-border);
}

.dot-answered {
  background-color: var(--color-primary-light);
}

.dot-current {
  background-color: var(--color-primary);
  transform: scale(1.3);
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.draft-banner {
  background-color: var(--color-primary-bg);
  border: 2rpx solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
}

.draft-text {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.draft-actions {
  display: flex;
  gap: 16rpx;
}

.btn-sm {
  padding: 8rpx 24rpx;
  font-size: var(--font-sm);
  height: auto;
  line-height: 1.5;
}
</style>
