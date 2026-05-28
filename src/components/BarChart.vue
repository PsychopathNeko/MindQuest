<template>
  <view class="chart-wrap">
    <ChartSkeleton v-if="!chartReady" :height="canvasHeight" />
    <canvas v-show="chartReady" type="2d" :id="canvasId" class="chart-canvas" :style="{ width: '100%', height: canvasHeight + 'px' }" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, getCurrentInstance, watch } from 'vue'
import uCharts from '@qiun/ucharts'
import ChartSkeleton from './ChartSkeleton.vue'
import { useTheme } from '../composables/useTheme'
import { getSeverityColor } from '../engine/reportEngine'

const props = defineProps({
  subscales: { type: Array, required: true },
  maxDisplayScore: { type: Number, default: 0 },
  color: { type: String, default: '#7da2f7' },
})

const instance = getCurrentInstance()
const { resolvedTheme } = useTheme()
let chartInstance = null
const chartReady = ref(false)

const canvasId = 'bar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)

const canvasHeight = computed(() => {
  return Math.max(200, props.subscales.length * 45)
})

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

        const subscaleNames = props.subscales.map((s) => s.name)
        const subscaleScores = props.subscales.map((s) =>
          s.displayScore !== undefined ? s.displayScore : s.score
        )

        // Determine max axis value
        let maxVal
        if (props.maxDisplayScore > 0) {
          maxVal = props.maxDisplayScore
        } else {
          const maxFromScores = Math.max(...props.subscales.map((s) => s.maxScore || s.score))
          maxVal = maxFromScores > 0 ? maxFromScores : 100
        }

        // Build color array per bar based on severity level
        const barColors = props.subscales.map((s) => {
          if (s.level) {
            return getSeverityColor(s.level)
          }
          return props.color
        })

        if (chartInstance) {
          chartInstance.dispose && chartInstance.dispose()
        }

        chartInstance = new uCharts({
          type: 'bar',
          context: ctx,
          canvas2d: true,
          width: actualWidth,
          height: actualHeight,
          pixelRatio: dpr,
          animation: !matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
          timing: 'easeInOut',
          duration: 800,
          categories: subscaleNames,
          series: [
            {
              name: 'Score',
              data: subscaleScores,
              color: barColors,
            },
          ],
          xAxis: {
            disabled: false,
            fontSize: 11 * dpr,
            fontColor: isDark ? '#a8a0b8' : '#6b7280',
            gridColor: isDark ? '#3d3650' : '#e8e5f0',
            max: maxVal,
          },
          yAxis: {
            disabled: false,
            data: [
              {
                fontSize: 11 * dpr,
                fontColor: isDark ? '#a8a0b8' : '#6b7280',
                gridColor: isDark ? '#3d3650' : '#e8e5f0',
              },
            ],
          },
          legend: { show: false },
          padding: [15, 30, 15, 10],
          dataLabel: true,
          extra: {
            bar: {
              type: 'group',
              width: 20 * dpr,
              seriesGap: 2,
              categoryGap: 5,
              meterBorder: 1,
              activeBgColor: isDark ? '#2d2640' : '#f3f1f8',
              activeBgOpacity: 0.08,
              linearType: 'none',
              barBorderCircle: true,
              colorStop: 0,
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
  () => [props.subscales, props.maxDisplayScore, props.color, resolvedTheme.value],
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
