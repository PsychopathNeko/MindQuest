<template>
  <view :class="['page-report', resolvedTheme === 'dark' ? 'dark' : '']">
    <view v-if="!record" class="error-state">
      <text class="error-text">{{ t('report.notFound') || 'Record not found' }}</text>
      <button class="btn btn-primary mt-lg" @tap="goHome">{{ t('report.backHome') }}</button>
    </view>

    <scroll-view v-else scroll-y id="report-content" class="report-content" :style="{ height: contentHeight + 'px' }">
      <!-- Score summary card -->
      <view class="score-card card">
        <text class="score-label">{{ record.scaleName }}</text>
        <view class="score-main">
          <text class="score-number" :style="{ color: severityColor }">{{ record.scores.total }}</text>
          <text class="score-max" v-if="maxScore">/{{ maxScore }}</text>
        </view>
        <view class="score-badge" :style="{ backgroundColor: badgeBgColor, color: severityColor }">
          <text>{{ record.report.label }}</text>
        </view>
        <text class="score-date">{{ formatDate(record.timestamp) }}</text>
      </view>

      <!-- Charts -->
      <view v-if="chartConfig" class="charts-section">
        <GaugeChart
          v-if="showGauge"
          :score="record.scores.total"
          :maxScore="gaugeMaxScore"
          :minScore="gaugeMinScore"
          :label="record.report.label"
          :color="severityColor"
        />
        <BarChart
          v-if="showBar && barSubscales.length"
          :subscales="barSubscales"
          :maxDisplayScore="barMaxDisplayScore"
          :color="severityColor"
        />
        <RadarChart
          v-if="showRadar && radarSubscales.length"
          :subscales="radarSubscales"
          :indicators="radarIndicators"
          :color="severityColor"
        />
      </view>

      <!-- Crisis alert -->
      <view v-if="showCrisis" class="crisis-card card">
        <text class="crisis-title">{{ t('crisis.title') }}</text>
        <text class="crisis-desc">{{ t('crisis.description') }}</text>
        <view class="crisis-lines">
          <text class="crisis-subtitle">{{ t('crisis.hotlineTitle') }}</text>
          <view class="crisis-line">
            <text>{{ t('crisis.line1Label') }}</text>
            <text class="crisis-number" @tap="callHotline(t('crisis.line1Number'))">{{ t('crisis.line1Number') }}</text>
          </view>
          <view class="crisis-line">
            <text>{{ t('crisis.line2Label') }}</text>
            <text class="crisis-number" @tap="callHotline(t('crisis.line2Number'))">{{ t('crisis.line2Number') }}</text>
          </view>
          <view class="crisis-line">
            <text>{{ t('crisis.line3Label') }}</text>
            <text class="crisis-number" @tap="callHotline(t('crisis.line3Number'))">{{ t('crisis.line3Number') }}</text>
          </view>
          <!-- #ifdef H5 -->
          <view class="crisis-line">
            <text class="crisis-link" @tap="openCrisisLink">{{ t('crisis.line4Label') }}</text>
          </view>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <view class="crisis-line">
            <text class="crisis-link" @tap="copyCrisisLink">{{ t('crisis.line4Label') }}</text>
          </view>
          <!-- #endif -->
        </view>
        <text class="crisis-action">{{ t('crisis.action') }}</text>
      </view>

      <!-- Overall interpretation -->
      <view class="interpretation-card card">
        <text class="section-title">{{ t('report.overallInterpretation') }}</text>
        <text v-if="record.report.description" class="interp-desc">{{ record.report.description }}</text>
        <text v-else class="interp-desc text-secondary">{{ t('report.noTotalInterpretation') }}</text>
      </view>

      <!-- Subscale details -->
      <view v-if="record.report.subscaleReports && record.report.subscaleReports.length" class="subscale-section">
        <text class="section-title-standalone">{{ t('report.subscaleDetails') }}</text>
        <view
          v-for="sub in record.report.subscaleReports"
          :key="sub.id"
          class="subscale-card card"
        >
          <view class="sub-header">
            <text class="sub-name">{{ sub.name }}</text>
            <view class="sub-score">
              <text class="sub-score-value" :style="{ color: getSubColor(sub.level) }">{{ sub.displayScore || sub.score }}</text>
              <text class="sub-score-max" v-if="sub.maxScore">/{{ sub.maxScore }}</text>
            </view>
          </view>
          <view class="sub-bar-wrap">
            <view class="sub-bar">
              <view
                class="sub-bar-fill"
                :style="{ width: getSubPercent(sub) + '%', backgroundColor: getSubColor(sub.level) }"
              ></view>
            </view>
          </view>
          <view class="sub-meta">
            <text class="sub-level" :style="{ color: getSubColor(sub.level) }">{{ sub.label }}</text>
          </view>
          <text v-if="sub.description" class="sub-desc">{{ sub.description }}</text>
        </view>
      </view>

      <!-- Suggestions -->
      <view v-if="record.report.suggestions && record.report.suggestions.length" class="suggestions-card card">
        <text class="section-title">{{ t('suggestion.title') }}</text>
        <view class="suggestion-list">
          <view v-for="(sug, idx) in record.report.suggestions" :key="idx" class="suggestion-item">
            <text class="suggestion-bullet">&#x2022;</text>
            <text class="suggestion-text">{{ sug }}</text>
          </view>
        </view>
      </view>

      <!-- Disclaimer -->
      <view class="disclaimer-card">
        <text class="disclaimer-text">{{ t('report.disclaimer') }}</text>
      </view>

      <!-- Actions -->
      <view class="report-actions">
        <button v-if="nextInQueue" class="btn btn-primary btn-block" @tap="startNext">
          {{ t('report.startNext', { name: nextInQueue.shortName || nextInQueue.name }) }}
        </button>
        <button :class="['btn', 'btn-block', nextInQueue ? 'btn-outline' : 'btn-primary']" @tap="retake">{{ t('report.retake') }}</button>
        <!-- #ifdef H5 -->
        <button class="btn btn-outline btn-block btn-secondary no-print" :disabled="exportingPdf" @tap="handleExportPdf">
          {{ exportingPdf ? t('report.generatingPdf') : t('report.exportPdf') }}
        </button>
        <!-- #endif -->
        <button class="btn btn-outline btn-block btn-secondary" @tap="goHome">{{ t('report.backHome') }}</button>
      </view>

      <view style="height: 60rpx;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useLocale } from '../../composables/useLocale'
import { useHistory } from '../../composables/useHistory'
import { useTheme } from '../../composables/useTheme'
import { useQueue } from '../../composables/useQueue'
import { getSeverityColor, getScorePercentage } from '../../engine/reportEngine'
import { getAssessment } from '../../utils/storage'
const GaugeChart = defineAsyncComponent(() => import('../../components/GaugeChart.vue'))
const BarChart = defineAsyncComponent(() => import('../../components/BarChart.vue'))
const RadarChart = defineAsyncComponent(() => import('../../components/RadarChart.vue'))

const { t, locale } = useLocale()
const { formatDate } = useHistory()
const { resolvedTheme } = useTheme()
const { queue, removeFromQueue } = useQueue()

const record = ref(null)
const exportingPdf = ref(false)
const loadedKey = ''
const contentHeight = ref(700)

const severityColor = computed(() => {
  if (!record.value?.report) return '#7da2f7'
  return getSeverityColor(record.value.report.level)
})

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const badgeBgColor = computed(() => {
  return hexToRgba(severityColor.value, 0.12)
})

const maxScore = computed(() => {
  if (!record.value) return null
  const scoring = record.value.scores
  if (scoring && scoring.subscales) {
    return scoring.subscales.reduce((sum, s) => sum + (s.maxScore || 0), 0)
  }
  return null
})

const showCrisis = computed(() => {
  if (!record.value?.report) return false
  const level = record.value.report.level
  return level === 'severe' || level === 'very_severe' || level === 'extremely_severe' || level === 'very_high' || level === 'clinical'
})

const nextInQueue = computed(() => {
  return queue.value.length > 0 ? queue.value[0] : null
})

const chartConfig = computed(() => {
  if (!record.value) return null
  return record.value.chartConfig || null
})

const showGauge = computed(() => {
  const cc = chartConfig.value
  return cc && cc.charts && cc.charts.includes('gauge')
})

const showBar = computed(() => {
  const cc = chartConfig.value
  return cc && cc.charts && cc.charts.includes('bar')
})

const showRadar = computed(() => {
  const cc = chartConfig.value
  return cc && cc.charts && cc.charts.includes('radar')
})

const gaugeMinScore = computed(() => {
  const cc = chartConfig.value
  if (cc && cc.gaugeConfig && cc.gaugeConfig.min !== undefined) return cc.gaugeConfig.min
  return 0
})

const gaugeMaxScore = computed(() => {
  const cc = chartConfig.value
  if (cc && cc.gaugeConfig && cc.gaugeConfig.max !== undefined) return cc.gaugeConfig.max
  // Fallback to calculated maxScore
  return maxScore.value || 100
})

const barSubscales = computed(() => {
  if (!record.value || !record.value.scores || !record.value.scores.subscales) return []
  const subscales = record.value.scores.subscales
  const reports = record.value.report && record.value.report.subscaleReports ? record.value.report.subscaleReports : []
  return subscales.map(s => {
    const report = reports.find(r => r.id === s.id)
    return {
      id: s.id,
      name: report ? report.name : s.id,
      score: s.score,
      displayScore: s.displayScore || s.score,
      maxScore: s.maxScore || 0,
      level: report ? report.level : 'normal',
      label: report ? report.label : ''
    }
  })
})

const barMaxDisplayScore = computed(() => {
  const cc = chartConfig.value
  if (cc && cc.barConfig && cc.barConfig.maxDisplayScore) return cc.barConfig.maxDisplayScore
  return 0
})

const radarIndicators = computed(() => {
  const cc = chartConfig.value
  if (cc && cc.radarConfig && cc.radarConfig.indicators) return cc.radarConfig.indicators
  return []
})

const radarSubscales = computed(() => {
  if (!record.value || !record.value.scores || !record.value.scores.subscales) return []
  const subscales = record.value.scores.subscales
  const indicators = radarIndicators.value
  if (indicators.length > 0) {
    // Match subscales to indicator order
    const cc = chartConfig.value
    const barConfig = cc && cc.barConfig
    const ids = barConfig && barConfig.subscaleIds ? barConfig.subscaleIds : subscales.map(s => s.id)
    return ids.map((id, idx) => {
      const s = subscales.find(sub => sub.id === id) || { id, score: 0 }
      const indicator = indicators[idx] || { name: id, max: 10 }
      return {
        id: s.id,
        name: indicator.name,
        score: s.displayScore || s.score,
        maxScore: indicator.max
      }
    })
  }
  return subscales.map(s => ({
    id: s.id,
    name: s.id,
    score: s.displayScore || s.score,
    maxScore: s.maxScore || 10
  }))
})

function getSubColor(level) {
  return getSeverityColor(level)
}

function getSubPercent(sub) {
  if (!sub.maxScore) return 50
  return getScorePercentage(sub.displayScore || sub.score, sub.maxScore)
}

function callHotline(number) {
  uni.makePhoneCall({ phoneNumber: number.replace(/\s/g, '') })
}

// #ifdef H5
function openCrisisLink() {
  window.open(t('crisis.line4Href'), '_blank')
}
// #endif

// #ifndef H5
function copyCrisisLink() {
  uni.setClipboardData({ data: t('crisis.line4Href') })
}
// #endif

function retake() {
  if (record.value) {
    uni.redirectTo({
      url: `/pages/assessment/index?id=${record.value.scaleId}`
    })
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

function startNext() {
  const next = nextInQueue.value
  if (!next) return
  const nextId = next.id
  uni.redirectTo({
    url: `/pages/assessment/index?id=${nextId}`,
    success() {
      removeFromQueue(nextId)
    }
  })
}

// #ifdef H5
async function handleExportPdf() {
  exportingPdf.value = true
  try {
    const { exportReportPdf } = await import('../../utils/pdfExport')
    const name = record.value ? record.value.scaleName : 'Report'
    await exportReportPdf('#report-content', `MindQuest_${name}.pdf`)
  } catch (err) {
    console.error('PDF export failed:', err)
    uni.showToast({ title: 'Export failed', icon: 'none' })
  } finally {
    exportingPdf.value = false
  }
}
// #endif

function updateReportMeta() {
  // #ifdef H5
  const name = record.value?.scaleName || ''
  
  // Update document title
  document.title = `${name} ${t('report.report')} - MindQuest`

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = `${name} assessment report - MindQuest`

  // Set canonical
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = window.location.href.split('?')[0]

  // Add noindex for personal report pages
  let robotsMeta = document.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    document.head.appendChild(robotsMeta)
  }
  robotsMeta.content = 'noindex, nofollow'

  // OG tags for report
  const ogUpdates = {
    'og:title': `${name} ${t('report.report')} - MindQuest`,
    'og:description': `${name} - MindQuest`,
    'og:url': window.location.href,
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
  // #endif
}

onLoad((options) => {
  const storageKey = options.key ? decodeURIComponent(options.key) : ''
  if (storageKey) {
    const data = getAssessment(storageKey)
    if (data) {
      record.value = data
      // Update page title for H5 SEO
      uni.setNavigationBarTitle({ title: data.scaleName + ' - MindQuest' })
      updateReportMeta()
    }
  }
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  contentHeight.value = sysInfo.windowHeight - 10
})
</script>

<style scoped>
.page-report {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.report-content {
  padding: 24rpx 30rpx;
}

.score-card {
  text-align: center;
  padding: 48rpx 32rpx;
}

.score-label {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 16rpx;
}

.score-main {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 16rpx;
}

.score-number {
  font-size: 96rpx;
  font-weight: 700;
  line-height: 1;
}

.score-max {
  font-size: var(--font-lg);
  color: var(--color-text-tertiary);
  margin-left: 4rpx;
}

.score-badge {
  display: inline-flex;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  font-size: var(--font-sm);
  font-weight: 500;
  margin-bottom: 16rpx;
}

.score-date {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
  display: block;
}

/* Crisis card */
.crisis-card {
  margin-top: 20rpx;
  padding: 28rpx;
  border: 2rpx solid var(--color-danger);
  background-color: var(--color-danger-bg);
}

.crisis-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-danger);
  display: block;
  margin-bottom: 12rpx;
}

.crisis-desc {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
}

.crisis-subtitle {
  font-size: var(--font-md);
  font-weight: 500;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 12rpx;
}

.crisis-line {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
  font-size: var(--font-base);
}

.crisis-number {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
}

.crisis-action {
  font-size: var(--font-sm);
  color: var(--color-danger);
  font-weight: 500;
  display: block;
  margin-top: 16rpx;
}

.crisis-link {
  color: var(--color-primary);
  font-size: var(--font-base);
  text-decoration: underline;
}

.btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

/* Interpretation */
.interpretation-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.section-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.section-title-standalone {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  padding: 20rpx 0 12rpx;
}

.interp-desc {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  line-height: 1.7;
}

/* Subscales */
.subscale-section {
  margin-top: 12rpx;
}

.subscale-card {
  margin-top: 16rpx;
  padding: 24rpx;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.sub-name {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.sub-score {
  display: flex;
  align-items: baseline;
}

.sub-score-value {
  font-size: var(--font-lg);
  font-weight: 700;
}

.sub-score-max {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
}

.sub-bar-wrap {
  margin-bottom: 12rpx;
}

.sub-bar {
  height: 12rpx;
  background-color: var(--color-surface-alt);
  border-radius: 6rpx;
  overflow: hidden;
}

.sub-bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.sub-meta {
  margin-bottom: 8rpx;
}

.sub-level {
  font-size: var(--font-sm);
  font-weight: 500;
}

.sub-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Suggestions */
.suggestions-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.suggestion-item {
  display: flex;
  gap: 12rpx;
}

.suggestion-bullet {
  color: var(--color-primary);
  font-weight: 700;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  line-height: 1.5;
}

/* Disclaimer */
.disclaimer-card {
  margin-top: 24rpx;
  padding: 20rpx;
  background-color: var(--color-surface-alt);
  border-radius: var(--radius-md);
}

.disclaimer-text {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

/* Actions */
.report-actions {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.error-text {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

/* Charts */
.charts-section {
  margin-top: 20rpx;
}
</style>
