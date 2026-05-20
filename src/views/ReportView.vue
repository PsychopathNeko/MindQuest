<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssessment } from '@/utils/storage'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useLocale } from '@/composables/useLocale'
import { getSeverityColor } from '@/engine/reportEngine'
import ReportLayout from '@/components/report/ReportLayout.vue'
import ScoreSummary from '@/components/report/ScoreSummary.vue'
import GaugeChart from '@/components/report/GaugeChart.vue'
import BarChart from '@/components/report/BarChart.vue'
import RadarChart from '@/components/report/RadarChart.vue'
import InterpretationCard from '@/components/report/InterpretationCard.vue'
import SuggestionCard from '@/components/report/SuggestionCard.vue'
import TimelineChart from '@/components/report/TimelineChart.vue'
import { getAssessmentsForScale } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const { loading: scaleLoading, error: scaleError, loadScale } = useScaleLoader()
const { t, locale } = useLocale()

const scaleId = computed(() => route.params.id)
const assessmentKey = computed(() => route.query.key)
const assessment = ref(null)
const scale = ref(null)
const loadError = ref(null)

const scores = computed(() => assessment.value?.scores ?? null)
const report = computed(() => assessment.value?.report ?? null)
const scaleName = computed(() => assessment.value?.scaleName ?? '')
const scaleReport = computed(() => scale.value?.report ?? null)
const hasSubscales = computed(() => !!scores.value?.subscales && scores.value.subscales.length > 0)
const charts = computed(() => scaleReport.value?.charts ?? [])
const totalColor = computed(() => { if (!report.value) return '#6b7280'; return getSeverityColor(report.value.level) })
const maxTotal = computed(() => {
  if (!scale.value?.scoring?.maxTotal) return 0
  return scale.value.scoring.maxTotal
})
const gaugeMin = computed(() => { if (!scaleReport.value?.gaugeConfig) return 0; return scaleReport.value.gaugeConfig.min ?? 0 })
const gaugeMax = computed(() => { if (!scaleReport.value?.gaugeConfig) return maxTotal.value; return scaleReport.value.gaugeConfig.max ?? maxTotal.value })
const scaleHistory = computed(() => {
  if (!scaleId.value) return []
  return getAssessmentsForScale(scaleId.value)
})
const showTotalScore = computed(() => { if (!scale.value) return false; return scale.value.scoring.method !== 'mean_subscale' })

const formattedTime = computed(() => {
  if (!assessment.value?.timestamp) return ''
  const d = new Date(assessment.value.timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
})

onMounted(async () => {
  if (!assessmentKey.value) { loadError.value = t('report.missingParam'); return }
  const data = getAssessment(assessmentKey.value)
  if (!data) { loadError.value = t('report.notFound'); return }
  assessment.value = data
  try {
    const scaleData = await loadScale(scaleId.value)
    if (!scaleData) { loadError.value = scaleError.value || t('detail.loadError'); return }
    scale.value = scaleData
  } catch (e) {
    loadError.value = scaleError.value || t('detail.loadError')
    return
  }
})

watch(scaleId, async (newId) => {
  if (newId) {
    const scaleData = await loadScale(newId)
    if (scaleData) scale.value = scaleData
  }
})

watch(locale, async () => {
  if (scaleId.value) {
    const scaleData = await loadScale(scaleId.value)
    if (scaleData) scale.value = scaleData
  }
})

function handleRetake() { router.push({ name: 'assessment', params: { id: scaleId.value } }) }
function handleHome() { router.push({ name: 'home' }) }
function handlePrint() { window.print() }
</script>
<template>
  <div class="container">
    <div v-if="scaleLoading && !loadError" class="state-block">
      <div class="spinner"></div>
      <p>{{ t('report.loading') }}</p>
    </div>

    <div v-else-if="loadError" class="state-block error-state">
      <div class="error-icon">!</div>
      <p class="error-text">{{ loadError }}</p>
      <button class="btn btn-primary" @click="handleHome">{{ t('report.backHome') }}</button>
    </div>

    <ReportLayout v-else-if="assessment && scale" :title="scaleName">
      <template #title>
        <h1 class="report-main-title">{{ scaleName }}</h1>
        <p class="report-timestamp">{{ t('report.completedAt') }}: {{ formattedTime }}</p>
      </template>

      <ScoreSummary v-if="showTotalScore" :score="scores.total" :max-score="gaugeMax" :label="report.label" :level="report.level" :color="totalColor" />

      <div v-if="charts.includes('gauge')" class="chart-section">
        <GaugeChart :score="scores.total" :max-score="gaugeMax" :min-score="gaugeMin" :label="report.label" :color="totalColor" />
      </div>

      <InterpretationCard v-if="report.level !== 'unknown' && report.description" :title="t('report.overallInterpretation')" :description="report.description" :level="report.level" />
      <TimelineChart :assessments="scaleHistory" :max-score="gaugeMax" :min-score="gaugeMin" :show-subscales="hasSubscales" />

      <template v-if="hasSubscales">
        <div class="section-divider"><h2 class="section-title">{{ t('report.subscaleDetails') }}</h2></div>
        <div v-if="charts.includes('bar')" class="chart-section"><BarChart :subscales="scores.subscales" :subscale-reports="report.subscaleReports" /></div>
        <div v-if="charts.includes('radar')" class="chart-section"><RadarChart :subscales="scores.subscales" :subscale-reports="report.subscaleReports" /></div>
        <div v-if="report.subscaleReports" class="subscale-cards">
          <InterpretationCard v-for="sub in report.subscaleReports" :key="sub.id" :title="sub.name + ': ' + sub.label" :description="sub.description" :level="sub.level" />
        </div>
      </template>

      <SuggestionCard :suggestions="report.suggestions" />

      <div class="action-buttons no-print">
        <button class="btn btn-outline" @click="handleRetake">{{ t('report.retake') }}</button>
        <button class="btn btn-outline" @click="handlePrint">{{ t('report.print') }}</button>
        <button class="btn btn-primary" @click="handleHome">{{ t('report.backHome') }}</button>
      </div>

      <div class="disclaimer no-print"><p>{{ t('report.disclaimer') }}</p></div>
    </ReportLayout>
  </div>
</template>

<style scoped>
.report-main-title { font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary); margin: 0 0 var(--spacing-2); }
.report-timestamp { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: 0; }
.chart-section { background-color: var(--color-surface); border-radius: var(--border-radius); border: 1px solid var(--color-border); box-shadow: var(--shadow-sm); padding: var(--spacing-4); }
.section-divider { padding-top: var(--spacing-4); }
.section-title { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text-primary); margin: 0; padding-bottom: var(--spacing-2); border-bottom: 2px solid var(--color-primary); display: inline-block; }
.subscale-cards { display: flex; flex-direction: column; gap: var(--spacing-4); }
.action-buttons { display: flex; justify-content: center; gap: var(--spacing-3); flex-wrap: wrap; padding-top: var(--spacing-4); }
.action-buttons .btn { min-width: 120px; }
.disclaimer { text-align: center; padding: var(--spacing-4); border-top: 1px solid var(--color-border); }
.disclaimer p { font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
.state-block { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4); padding: var(--spacing-12) 0; color: var(--color-text-secondary); }
.error-state { text-align: center; }
.error-icon { width: 48px; height: 48px; border-radius: var(--border-radius-full); background-color: #fef2f2; color: var(--color-danger); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xl); font-weight: 700; }
.error-text { color: var(--color-danger); font-size: var(--font-size-base); }
@media print {
  .no-print { display: none !important; }
  .chart-section { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
  .report-main-title { font-size: 24pt; }
  .section-title { font-size: 16pt; }
  .state-block { display: none; }
  .subscale-cards { break-inside: avoid; }
}
@media (max-width: 640px) {
  .action-buttons { flex-direction: column; align-items: stretch; }
  .action-buttons .btn { min-width: auto; }
  .report-main-title { font-size: var(--font-size-2xl); }
  .chart-section { padding: var(--spacing-2); overflow-x: auto; }
  .section-title { font-size: var(--font-size-lg); }
}
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
