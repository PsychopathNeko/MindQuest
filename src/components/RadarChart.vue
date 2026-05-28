<template>
  <view class="chart-wrap">
    <ChartSkeleton v-if="!chartReady" :height="canvasHeight" />
    <canvas v-show="chartReady" type="2d" :id="canvasId" class="chart-canvas" :style="{ width: '100%', height: canvasHeight + 'px' }" />
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick, getCurrentInstance, watch } from 'vue'
import uCharts from '@qiun/ucharts'
import ChartSkeleton from './ChartSkeleton.vue'
import { useTheme } from '../composables/useTheme'

const props = defineProps({
  subscales: { type: Array, required: true },
  indicators: { type: Array, default: () => [] },
  color: { type: String, default: '#7da2f7' },
})

const instance = getCurrentInstance()
const { resolvedTheme } = useTheme()
let chartInstance = null
const chartReady = ref(false)

const canvasHeight = 300
const canvasId = 'radar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)

function initChart() {
  chartReady.value = false
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance.proxy)
    query
      .select('#' + canvasId)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) {
          chartReady.value = true
          return
        }
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio
        const actualWidth = res[0].width * dpr
        const actualHeight = res[0].height * dpr
        canvas.width = actualWidth
        canvas.height = actualHeight

        const isDark = resolvedTheme.value === 'dark'

        // Build indicator data: prefer explicit indicators, otherwise derive from subscales
        let indicatorNames
        let scores
        let maxVal

        if (props.indicators.length > 0) {
          indicatorNames = props.indicators.map((ind) => ind.name)
          // Map scores in the same order as indicators
          scores = props.indicators.map((ind) => {
            const sub = props.subscales.find((s) => s.name === ind.name || s.id === ind.name)
            return sub ? (sub.displayScore !== undefined ? sub.displayScore : sub.score) : 0
          })
          maxVal = Math.max(...props.indicators.map((ind) => ind.max))
        } else {
          indicatorNames = props.subscales.map((s) => s.name)
          scores = props.subscales.map((s) =>
            s.displayScore !== undefined ? s.displayScore : s.score
          )
          const maxFromSubscales = Math.max(...props.subscales.map((s) => s.maxScore || s.score))
          maxVal = maxFromSubscales > 0 ? maxFromSubscales : 100
        }

        if (chartInstance) {
          chartInstance.dispose && chartInstance.dispose()
        }

        chartInstance = new uCharts({
          type: 'radar',
          context: ctx,
          canvas2d: true,
          width: actualWidth,
          height: actualHeight,
          pixelRatio: dpr,
          animation: !matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
          timing: 'easeInOut',
          duration: 800,
          categories: indicatorNames,
          series: [
            {
              name: 'Score',
              data: scores,
              color: props.color,
            },
          ],
          legend: { show: false },
          padding: [10, 10, 10, 10],
          dataLabel: false,
          extra: {
            radar: {
              gridType: 'radar',
              gridColor: isDark ? '#3d3650' : '#e8e5f0',
              gridCount: 4,
              labelColor: isDark ? '#a8a0b8' : '#6b7280',
              labelPointSize: 0,
              opacity: 0.3,
              border: true,
              borderWidth: 2,
              max: maxVal,
            },
          },
        })
        chartReady.value = true
      })
  })
}

onMounted(() => {
  initChart()
})

watch(
  () => [props.subscales, props.indicators, props.color, resolvedTheme.value],
  () => {
    initChart()
  },
  { deep: true }
)
</script>

<style scoped>
.chart-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
}
.chart-canvas {
  width: 100% !important;
}
</style>
