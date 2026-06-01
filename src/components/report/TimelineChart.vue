<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartOptions } from '@/composables/useChartOptions'
import { useLocale } from '@/composables/useLocale'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  assessments: { type: Array, required: true },
  maxScore: { type: Number, required: true },
  minScore: { type: Number, default: 0 },
  showSubscales: { type: Boolean, default: true },
  hideTotal: { type: Boolean, default: false },
  multiplier: { type: Number, default: 1 },
})

const { t } = useLocale()
const { createTimelineOption } = useChartOptions()

const hasEnoughData = computed(() => props.assessments.length >= 2)

const dataPoints = computed(() => {
  return props.assessments.map((item) => {
    const d = new Date(item.data.timestamp)
    const pad = (n) => String(n).padStart(2, '0')
    const date = `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    const point = {
      date,
      total: (item.data.scores?.total ?? 0) * props.multiplier,
      level: item.data.report?.level ?? 'unknown',
    }
    if (props.showSubscales && item.data.scores?.subscales) {
      point.subscales = item.data.scores.subscales.map((sub) => ({
        name: sub.name,
        score: sub.score * props.multiplier,
      }))
    }
    return point
  })
})

const option = computed(() =>
  createTimelineOption(dataPoints.value, props.maxScore, props.minScore, props.hideTotal),
)
</script>

<template>
  <div class="timeline-section">
    <div class="timeline-header">
      <svg class="timeline-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <h2 class="timeline-title">{{ t('timeline.title') }}</h2>
    </div>
    <template v-if="hasEnoughData">
      <VChart class="timeline-chart" :option="option" autoresize />
    </template>
    <div v-else class="timeline-empty">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <p>{{ t('timeline.needMore') }}</p>
    </div>
  </div>
</template>

<style scoped>
.timeline-section {
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-4);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.timeline-icon {
  color: var(--color-primary);
}

.timeline-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.timeline-chart {
  height: 300px;
  width: 100%;
}

.timeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8) 0;
  text-align: center;
}

.empty-icon {
  color: var(--color-border);
}

.timeline-empty p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 640px) {
  .timeline-section {
    padding: var(--spacing-3);
  }

  .timeline-chart {
    height: 220px;
  }

  .timeline-empty {
    padding: var(--spacing-4) 0;
  }
}

@media print {
  .timeline-section {
    box-shadow: none;
    border: 1px solid #ddd;
    break-inside: avoid;
  }
}
</style>
