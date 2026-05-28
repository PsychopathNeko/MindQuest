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
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  minScore: { type: Number, default: 0 },
  label: { type: String, default: '' },
  color: { type: String, default: '#7da2f7' },
})

const instance = getCurrentInstance()
const { resolvedTheme } = useTheme()
let chartInstance = null
const chartReady = ref(false)

const canvasHeight = 200
const canvasId = 'gauge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)

/**
 * Adjust a hex color's brightness by a percentage.
 * Positive percent lightens the color.
 */
function adjustColorBrightness(hex, percent) {
  let color = hex.replace(/^#/, '')
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
  }
  const num = parseInt(color, 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff

  r = Math.min(255, Math.max(0, Math.round(r + (255 - r) * (percent / 100))))
  g = Math.min(255, Math.max(0, Math.round(g + (255 - g) * (percent / 100))))
  b = Math.min(255, Math.max(0, Math.round(b + (255 - b) * (percent / 100))))

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

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
        const range = props.maxScore - props.minScore
        const ratio = range > 0 ? (props.score - props.minScore) / range : 0

        if (chartInstance) {
          chartInstance.dispose && chartInstance.dispose()
        }

        chartInstance = new uCharts({
          type: 'arcbar',
          context: ctx,
          canvas2d: true,
          width: actualWidth,
          height: actualHeight,
          pixelRatio: dpr,
          animation: !matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
          timing: 'easeInOut',
          duration: 1000,
          title: {
            name: String(props.score),
            fontSize: 32 * dpr,
            color: props.color,
          },
          subtitle: {
            name: props.label,
            fontSize: 13 * dpr,
            color: isDark ? '#a8a0b8' : '#6b7280',
          },
          series: [
            {
              name: 'Score',
              data: ratio,
              color: props.color,
            },
          ],
          extra: {
            arcbar: {
              type: 'default',
              width: 12 * dpr,
              backgroundColor: isDark ? '#3d3650' : '#e8e5f0',
              gap: 2,
              startAngle: 0.75,
              endAngle: 0.25,
              linearType: 'custom',
              customColor: [props.color, adjustColorBrightness(props.color, 30)],
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
  () => [props.score, props.maxScore, props.minScore, props.label, props.color, resolvedTheme.value],
  () => {
    initChart()
  }
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
