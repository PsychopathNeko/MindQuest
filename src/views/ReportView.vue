<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssessment } from '@/utils/storage'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { getSeverityColor } from '@/engine/reportEngine'
import ReportLayout from '@/components/report/ReportLayout.vue'
import ScoreSummary from '@/components/report/ScoreSummary.vue'
import GaugeChart from '@/components/report/GaugeChart.vue'
import BarChart from '@/components/report/BarChart.vue'
import RadarChart from '@/components/report/RadarChart.vue'
import InterpretationCard from '@/components/report/InterpretationCard.vue'
import SuggestionCard from '@/components/report/SuggestionCard.vue'

const route = useRoute()
const router = useRouter()
const { loading: scaleLoading, error: scaleError, loadScale } = useScaleLoader()

const scaleId = route.params.id
const assessmentKey = route.query.key

// State
const assessment = ref(null)
const scale = ref(null)
const loadError = ref(null)

// Derived data
const scores = computed(() => assessment.value?.scores ?? null)
const report = computed(() => assessment.value?.report ?? null)
const scaleName = computed(() => assessment.value?.scaleName ?? '')
const scaleReport = computed(() => scale.value?.report ?? null)
const hasSubscales = computed(() => !!scores.value?.subscales && scores.value.subscales.length > 0)
const charts = computed(() => scaleReport.value?.charts ?? [])

const totalColor = computed(() => {
  if (!report.value) return '#6b7280'
  return getSeverityColor(report.value.level)
})

const maxTotal = computed(() => {
  if (!scale.value) return 0
  return scale.value.scoring.maxTotal ?? 0
})

const gaugeMin = computed(() => {
  if (!scaleReport.value?.gaugeConfig) return 0
  return scaleReport.value.gaugeConfig.min ?? 0
})

const gaugeMax = computed(() => {
  if (!scaleReport.value?.gaugeConfig) return maxTotal.value
  return scaleReport.value.gaugeConfig.max ?? maxTotal.value
})

const formattedTime = computed(() => {
  if (!assessment.value?.timestamp) return ''
  const d = new Date(assessment.value.timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

const showTotalScore = computed(() => {
  if (!scale.value) return false
  return scale.value.scoring.method !== 'mean_subscale'
})

// Load data
onMounted(async () => {
  if (!assessmentKey) {
    loadError.value = '缺少测评结果参数'
    return
  }

  const data = getAssessment(assessmentKey)
  if (!data) {
    loadError.value = '未找到该测评记录，可能已被清除'
    return
  }

  assessment.value = data

  const scaleData = await loadScale(scaleId)
  if (!scaleData) {
    loadError.value = scaleError.value || '量表数据加载失败'
    return
  }
  scale.value = scaleData
})

function handleRetake() {
  router.push({ name: 'assessment', params: { id: scaleId } })
}

function handleHome() {
  router.push({ name: 'home' })
}

function handlePrint() {
  window.print()
}
</script>
<template>
  <div class="container">
    <!-- Loading -->
    <div v-if="scaleLoading && !loadError" class="state-block">
      <div class="spinner"></div>
      <p>加载报告中...</p>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="state-block error-state">
      <div class="error-icon">!</div>
      <p class="error-text">{{ loadError }}</p>
      <button class="btn btn-primary" @click="handleHome">返回首页</button>
    </div>

    <!-- Report Content -->
    <ReportLayout v-else-if="assessment && scale" :title="scaleName">
      <template #title>
        <h1 class="report-main-title">{{ scaleName }}</h1>
        <p class="report-timestamp">完成时间: {{ formattedTime }}</p>
      </template>

      <!-- Total Score Summary (for sum-type scales) -->
      <ScoreSummary
        v-if="showTotalScore"
        :score="scores.total"
        :max-score="gaugeMax"
        :label="report.label"
        :level="report.level"
        :color="totalColor"
      />

      <!-- Gauge Chart -->
      <div v-if="charts.includes('gauge')" class="chart-section">
        <GaugeChart
          :score="scores.total"
          :max-score="gaugeMax"
          :min-score="gaugeMin"
          :label="report.label"
          :color="totalColor"
        />
      </div>

      <!-- Overall Interpretation (for scales with overall ranges) -->
      <InterpretationCard
        v-if="report.level !== 'unknown' && report.description"
        title="总体结果解读"
        :description="report.description"
        :level="report.level"
      />

      <!-- Subscale Section -->
      <template v-if="hasSubscales">
        <div class="section-divider">
          <h2 class="section-title">分维度详情</h2>
        </div>

        <!-- Bar Chart -->
        <div v-if="charts.includes('bar')" class="chart-section">
          <BarChart
            :subscales="scores.subscales"
            :subscale-reports="report.subscaleReports"
          />
        </div>

        <!-- Radar Chart -->
        <div v-if="charts.includes('radar')" class="chart-section">
          <RadarChart
            :subscales="scores.subscales"
            :subscale-reports="report.subscaleReports"
          />
        </div>

        <!-- Individual subscale interpretation cards -->
        <div v-if="report.subscaleReports" class="subscale-cards">
          <InterpretationCard
            v-for="sub in report.subscaleReports"
            :key="sub.id"
            :title="sub.name + ': ' + sub.label"
            :description="sub.description"
            :level="sub.level"
          />
        </div>
      </template>

      <!-- Suggestions -->
      <SuggestionCard :suggestions="report.suggestions" />

      <!-- Action Buttons -->
      <div class="action-buttons no-print">
        <button class="btn btn-outline" @click="handleRetake">重新测评</button>
        <button class="btn btn-outline" @click="handlePrint">打印报告</button>
        <button class="btn btn-primary" @click="handleHome">返回首页</button>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer no-print">
        <p>
          免责声明: 本测评结果仅供参考，不构成任何医学诊断或治疗建议。如您感到困扰或需要帮助，请咨询专业的心理健康服务人员。
        </p>
      </div>
    </ReportLayout>
  </div>
</template>

<style scoped>
.report-main-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2);
}

.report-timestamp {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.chart-section {
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.section-divider {
  padding-top: var(--spacing-4);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.subscale-cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  padding-top: var(--spacing-4);
}

.action-buttons .btn {
  min-width: 120px;
}

.disclaimer {
  text-align: center;
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

.disclaimer p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* States */
.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-12) 0;
  color: var(--color-text-secondary);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-full);
  background-color: #fef2f2;
  color: var(--color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-size-base);
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .chart-section {
    box-shadow: none;
    border: 1px solid #ddd;
    break-inside: avoid;
  }
}

@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons .btn {
    min-width: auto;
  }
}
</style>
