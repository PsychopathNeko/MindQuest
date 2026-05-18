import { getSeverityColor } from '@/engine/reportEngine'

/**
 * Composable for generating ECharts option objects.
 */
export function useChartOptions() {
  return { createGaugeOption, createBarOption, createRadarOption }
}

/**
 * Create a gauge chart option.
 *
 * @param {number} score     - Current score value
 * @param {number} maxScore  - Maximum possible score
 * @param {string} label     - Severity label text (e.g. "轻度抑郁")
 * @param {string} color     - CSS color for the gauge
 * @param {number} [minScore=0] - Minimum score (for scales like Rosenberg starting > 0)
 * @returns {Object} ECharts option
 */
function createGaugeOption(score, maxScore, label, color, minScore = 0) {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: minScore,
        max: maxScore,
        splitNumber: 5,
        itemStyle: {
          color: color,
        },
        progress: {
          show: true,
          roundCap: true,
          width: 14,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [[1, '#e5e7eb']],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        title: {
          show: true,
          offsetCenter: [0, '65%'],
          fontSize: 14,
          color: color,
          fontWeight: 500,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '30%'],
          fontSize: 36,
          fontWeight: 700,
          color: color,
          formatter: '{value}',
        },
        data: [
          {
            value: score,
            name: label,
          },
        ],
      },
    ],
  }
}

/**
 * Create a horizontal bar chart option for subscale scores.
 *
 * @param {Array<{id, name, score, maxScore}>} subscales - Subscale data
 * @param {Array<{id, name, score, displayScore, maxScore, level, label}>} subscaleReports
 * @returns {Object} ECharts option
 */
function createBarOption(subscales, subscaleReports) {
  const reportMap = {}
  if (subscaleReports) {
    subscaleReports.forEach((r) => {
      reportMap[r.id] = r
    })
  }

  const names = subscales.map((s) => s.name)

  // Use displayScore when available (e.g. DASS-21 multiplied scores)
  const scores = subscales.map((s) => {
    const report = reportMap[s.id]
    return report ? report.displayScore : s.score
  })

  const colors = subscales.map((s) => {
    const report = reportMap[s.id]
    return report ? getSeverityColor(report.level) : '#3b82f6'
  })

  // Determine max axis value
  const maxVals = subscales.map((s) => {
    const report = reportMap[s.id]
    if (report && report.displayScore !== report.score && report.score > 0) {
      return s.maxScore * (report.displayScore / report.score)
    }
    return s.maxScore
  })
  const axisMax = Math.ceil(Math.max(...maxVals, ...scores) * 1.15)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        const idx = p.dataIndex
        const realIdx = subscales.length - 1 - idx
        const report = reportMap[subscales[realIdx].id]
        const labelStr = report ? report.label : ''
        return `${p.name}<br/>\u5F97\u5206: ${p.value}${labelStr ? ' (' + labelStr + ')' : ''}`
      },
    },
    grid: {
      left: 4,
      right: 40,
      top: 8,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      max: axisMax,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: {
        lineStyle: { color: '#f1f5f9', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      data: names.slice().reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#374151',
        fontSize: 13,
        fontWeight: 500,
      },
    },
    series: [
      {
        type: 'bar',
        data: scores
          .slice()
          .reverse()
          .map((val, i) => ({
            value: val,
            itemStyle: {
              color: colors[scores.length - 1 - i],
              borderRadius: [0, 4, 4, 0],
            },
          })),
        barWidth: 24,
        label: {
          show: true,
          position: 'right',
          color: '#374151',
          fontSize: 13,
          fontWeight: 600,
          formatter: '{c}',
        },
        animationDuration: 800,
        animationEasing: 'cubicOut',
      },
    ],
  }
}

/**
 * Create a radar chart option for multi-dimensional profiles.
 *
 * @param {Array<{id, name, score, maxScore}>} subscales - Subscale data
 * @param {Array<{id, name, score, displayScore, maxScore, level, label}>} subscaleReports
 * @returns {Object} ECharts option
 */
function createRadarOption(subscales, subscaleReports) {
  const reportMap = {}
  if (subscaleReports) {
    subscaleReports.forEach((r) => {
      reportMap[r.id] = r
    })
  }

  const indicators = subscales.map((s) => {
    const report = reportMap[s.id]
    let max = s.maxScore
    if (report && report.displayScore !== report.score && report.score > 0) {
      max = s.maxScore * (report.displayScore / report.score)
    }
    return { name: s.name, max: max }
  })

  const values = subscales.map((s) => {
    const report = reportMap[s.id]
    return report ? report.displayScore : s.score
  })

  return {
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#374151',
        fontSize: 12,
        fontWeight: 500,
      },
      splitLine: {
        lineStyle: { color: '#e5e7eb' },
      },
      splitArea: {
        areaStyle: {
          color: ['#fafafa', '#f5f5f5', '#fafafa', '#f5f5f5'],
        },
      },
      axisLine: {
        lineStyle: { color: '#e5e7eb' },
      },
    },
    tooltip: {
      trigger: 'item',
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '\u5F97\u5206',
            areaStyle: {
              color: 'rgba(59, 130, 246, 0.2)',
            },
            lineStyle: {
              color: '#3b82f6',
              width: 2,
            },
            itemStyle: {
              color: '#3b82f6',
              borderColor: '#fff',
              borderWidth: 2,
            },
            symbol: 'circle',
            symbolSize: 6,
          },
        ],
        animationDuration: 800,
      },
    ],
  }
}
