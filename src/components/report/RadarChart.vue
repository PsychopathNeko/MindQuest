<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent, RadarComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useChartOptions } from '@/composables/useChartOptions'

use([CanvasRenderer, RadarChart, TooltipComponent, RadarComponent])

const props = defineProps({
  subscales: { type: Array, required: true },
  subscaleReports: { type: Array, default: () => [] },
})

const { createRadarOption } = useChartOptions()

const option = computed(() => createRadarOption(props.subscales, props.subscaleReports))
</script>

<template>
  <div class="radar-chart-wrapper">
    <VChart class="radar-chart" :option="option" autoresize />
  </div>
</template>

<style scoped>
.radar-chart-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.radar-chart {
  height: 350px;
  width: 100%;
  max-width: 480px;
}

@media (max-width: 640px) {
  .radar-chart {
    height: 260px;
    max-width: 100%;
  }
}
</style>
