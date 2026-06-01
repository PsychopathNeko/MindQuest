import { computed } from 'vue'
import { getSeverityColor } from '@/engine/reportEngine'
import { useLocale } from './useLocale'
import { useTheme } from './useTheme'

function escapeHtml(str) {
  if (typeof str !== 'string') return str
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function useChartOptions() {
  const { t } = useLocale()
  const { resolvedTheme } = useTheme()
  const isDark = computed(() => resolvedTheme.value === 'dark')

  function chartColors() {
    const dark = isDark.value
    return {
      text: dark ? '#d1d5db' : '#374151',
      textSub: dark ? '#9ca3af' : '#6b6183',
      gridLine: dark ? '#3d3555' : '#e5e7eb',
      splitLine: dark ? '#332e45' : '#f1f5f9',
      splitArea: dark ? ['#252033', '#2d2845'] : ['#fafafa', '#f5f5f5'],
      axisLine: dark ? '#3d3555' : '#e8e2ed',
      gaugeTrack: dark ? '#3d3555' : '#e5e7eb',
      tooltipBg: dark ? 'rgba(37,32,51,0.96)' : 'rgba(255,255,255,0.96)',
      tooltipBorder: dark ? '#3d3555' : '#e8e2ed',
      tooltipText: dark ? '#f0ecf5' : '#2d2640',
      timelineSplitLine: dark ? '#332e45' : '#f1f0f4',
    }
  }

  return {
    createGaugeOption: (score, maxScore, label, color, minScore) => createGaugeOption(score, maxScore, label, color, minScore, chartColors()),
    createBarOption: (subscales, subscaleReports) => createBarOption(subscales, subscaleReports, t, chartColors()),
    createRadarOption: (subscales, subscaleReports) => createRadarOption(subscales, subscaleReports, t, chartColors()),
    createTimelineOption: (dataPoints, maxScore, minScore, hideTotal) => createTimelineOption(dataPoints, maxScore, minScore, t, chartColors(), hideTotal),
  }
}

/**
 * Create a gauge chart option.
 *
 * @param {number} score     - Current score value
 * @param {number} maxScore  - Maximum possible score
 * @param {string} label     - Severity label text
 * @param {string} color     - CSS color for the gauge
 * @param {number} [minScore=0] - Minimum score (for scales like Rosenberg starting > 0)
 * @returns {Object} ECharts option
 */
function createGaugeOption(score, maxScore, label, color, minScore = 0, colors = {}) {
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
            color: [[1, colors.gaugeTrack || '#e5e7eb']],
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
 * @param {Function} t - Translation function
 * @returns {Object} ECharts option
 */
function createBarOption(subscales, subscaleReports, t, colors = {}) {
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

  const barColors = subscales.map((s) => {
    const report = reportMap[s.id]
    if (report) return getSeverityColor(report.level)
    if (s.valence === 'adaptive') return '#10b981'
    if (s.valence === 'maladaptive') return '#f97316'
    return '#7da2f7'
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
        return `${p.name}<br/>${t('chart.scoreColon', { value: p.value })}${labelStr ? ' (' + labelStr + ')' : ''}`
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
        lineStyle: { color: colors.splitLine || '#f1f5f9', type: 'dashed' },
      },
    },
    yAxis: {
      type: 'category',
      data: names.slice().reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: colors.text || '#374151',
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
              color: barColors[scores.length - 1 - i],
              borderRadius: [0, 4, 4, 0],
            },
          })),
        barWidth: 24,
        label: {
          show: true,
          position: 'right',
          color: colors.text || '#374151',
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
 * @param {Function} t - Translation function
 * @returns {Object} ECharts option
 */
function createRadarOption(subscales, subscaleReports, t, colors = {}) {
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
        color: colors.text || '#374151',
        fontSize: 12,
        fontWeight: 500,
      },
      splitLine: {
        lineStyle: { color: colors.gridLine || '#e5e7eb' },
      },
      splitArea: {
        areaStyle: {
          color: colors.splitArea ? [colors.splitArea[0], colors.splitArea[1], colors.splitArea[0], colors.splitArea[1]] : ['#fafafa', '#f5f5f5', '#fafafa', '#f5f5f5'],
        },
      },
      axisLine: {
        lineStyle: { color: colors.gridLine || '#e5e7eb' },
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
            name: t('chart.score'),
            areaStyle: {
              color: 'rgba(125, 162, 247, 0.2)',
            },
            lineStyle: {
              color: '#7da2f7',
              width: 2,
            },
            itemStyle: {
              color: '#7da2f7',
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

/**
 * Create a timeline line chart for historical score trends.
 *
 * @param {Array<{ date: string, total: number, level: string, subscales?: Array<{ name: string, score: number }> }>} dataPoints
 * @param {number} maxScore
 * @param {number} minScore
 * @param {Function} t - Translation function
 * @returns {Object} ECharts option
 */
function createTimelineOption(dataPoints, maxScore, minScore, t, colors = {}, hideTotal = false) {
  const dates = dataPoints.map((d) => d.date)
  const totals = dataPoints.map((d) => d.total)

  // Collect all subscale names from dataPoints
  const subscaleNames = []
  const subscaleMap = {}
  dataPoints.forEach((d) => {
    if (d.subscales) {
      d.subscales.forEach((sub) => {
        if (!subscaleMap[sub.name]) {
          subscaleMap[sub.name] = []
          subscaleNames.push(sub.name)
        }
      })
    }
  })
  // Fill subscale data arrays
  subscaleNames.forEach((name) => {
    subscaleMap[name] = dataPoints.map((d) => {
      const sub = d.subscales?.find((s) => s.name === name)
      return sub ? sub.score : null
    })
  })

  const subscaleColors = ['#e8a0bf', '#a5bfff', '#f5c6d8', '#8dd1c1', '#c4b5fd', '#fbbf24']

  const series = hideTotal ? [] : [
    {
      name: t('timeline.total'),
      type: 'line',
      data: totals.map((val, i) => ({
        value: val,
        itemStyle: { color: getSeverityColor(dataPoints[i].level) },
      })),
      smooth: true,
      lineStyle: { color: '#7da2f7', width: 3 },
      itemStyle: { color: '#7da2f7', borderColor: '#fff', borderWidth: 2 },
      symbol: 'circle',
      symbolSize: 10,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(125, 162, 247, 0.2)' },
            { offset: 1, color: 'rgba(125, 162, 247, 0.02)' },
          ],
        },
      },
      z: 10,
    },
  ]

  subscaleNames.forEach((name, i) => {
    series.push({
      name: name,
      type: 'line',
      data: subscaleMap[name],
      smooth: true,
      lineStyle: { color: subscaleColors[i % subscaleColors.length], width: 2, type: 'dashed' },
      itemStyle: { color: subscaleColors[i % subscaleColors.length], borderColor: '#fff', borderWidth: 1 },
      symbol: 'circle',
      symbolSize: 6,
    })
  })

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.tooltipBg || 'rgba(255,255,255,0.96)',
      borderColor: colors.tooltipBorder || '#e8e2ed',
      borderWidth: 1,
      textStyle: { color: colors.tooltipText || '#2d2640', fontSize: 13 },
      formatter: (params) => {
        let html = `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(params[0].axisValue)}</div>`
        params.forEach((p) => {
          if (p.value != null) {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">`
            html += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${escapeHtml(p.color)}"></span>`
            html += `<span>${escapeHtml(p.seriesName)}: <b>${escapeHtml(String(p.value))}</b></span></div>`
          }
        })
        return html
      },
    },
    legend: {
      show: subscaleNames.length > 0,
      bottom: 0,
      textStyle: { color: colors.textSub || '#6b6183', fontSize: 12 },
      itemWidth: 16,
      itemHeight: 8,
    },
    grid: {
      left: 12,
      right: 20,
      top: 16,
      bottom: subscaleNames.length > 0 ? 40 : 12,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: colors.axisLine || '#e8e2ed' } },
      axisTick: { show: false },
      axisLabel: { color: colors.textSub || '#6b6183', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      min: minScore,
      max: maxScore,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.textSub || '#6b6183', fontSize: 12 },
      splitLine: { lineStyle: { color: colors.timelineSplitLine || '#f1f0f4', type: 'dashed' } },
    },
    series: series,
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }
}
