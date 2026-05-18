<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartOptions } from '@/composables/useChartOptions'

use([CanvasRenderer, BarChart, TooltipComponent, GridComponent])

const props = defineProps({
  subscales: { type: Array, required: true },
  subscaleReports: { type: Array, default: () => [] },
})

const { createBarOption } = useChartOptions()

const option = computed(() => createBarOption(props.subscales, props.subscaleReports))

const chartHeight = computed(() => {
  const h = Math.max(200, props.subscales.length * 60)
  return `${h}px`
})
</script>

<template>
  <div class="bar-chart-wrapper">
    <VChart class="bar-chart" :style="{ height: chartHeight }" :option="option" autoresize />
  </div>
</template>

<style scoped>
.bar-chart-wrapper {
  width: 100%;
}

.bar-chart {
  width: 100%;
  min-height: 200px;
}
</style>
