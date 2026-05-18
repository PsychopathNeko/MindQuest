<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartOptions } from '@/composables/useChartOptions'

use([CanvasRenderer, GaugeChart, TooltipComponent])

const props = defineProps({
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  minScore: { type: Number, default: 0 },
  label: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
})

const { createGaugeOption } = useChartOptions()

const option = computed(() =>
  createGaugeOption(props.score, props.maxScore, props.label, props.color, props.minScore),
)
</script>

<template>
  <div class="gauge-chart-wrapper">
    <VChart class="gauge-chart" :option="option" autoresize />
  </div>
</template>

<style scoped>
.gauge-chart-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.gauge-chart {
  height: 280px;
  width: 100%;
  max-width: 400px;
}
</style>
