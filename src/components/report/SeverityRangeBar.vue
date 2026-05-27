<script setup>
import { computed } from 'vue'
import { getSeverityColor } from '@/engine/reportEngine'

const props = defineProps({
  ranges: { type: Array, default: () => [] },
  currentLevel: { type: String, default: '' },
  currentScore: { type: Number, default: 0 },
})

const overallMin = computed(() => {
  if (!props.ranges.length) return 0
  return Math.min(...props.ranges.map(r => r.min))
})

const overallMax = computed(() => {
  if (!props.ranges.length) return 0
  return Math.max(...props.ranges.map(r => r.max))
})

const totalSpan = computed(() => overallMax.value - overallMin.value || 1)

const segments = computed(() => {
  return props.ranges.map(r => {
    const span = r.max - r.min + 1
    return {
      label: r.label,
      level: r.level,
      min: r.min,
      max: r.max,
      widthPct: (span / (totalSpan.value + 1)) * 100,
      color: getSeverityColor(r.level),
      active: r.level === props.currentLevel,
    }
  })
})

const markerLeftPct = computed(() => {
  const score = props.currentScore
  const min = overallMin.value
  const span = totalSpan.value + 1
  const pct = ((score - min + 0.5) / span) * 100
  return Math.max(2, Math.min(98, pct))
})
</script>

<template>
  <div v-if="ranges.length > 1" class="severity-range-bar">
    <div class="bar-track">
      <div
        v-for="(seg, i) in segments"
        :key="i"
        class="bar-segment"
        :class="{ 'is-active': seg.active }"
        :style="{ width: seg.widthPct + '%', backgroundColor: seg.color }"
      >
        <span class="seg-label">{{ seg.label }}</span>
      </div>
    </div>
    <div class="score-indicator" :style="{ left: markerLeftPct + '%' }">
      <span class="indicator-arrow">▼</span>
    </div>
  </div>
</template>

<style scoped>
.severity-range-bar {
  position: relative;
  padding-bottom: var(--spacing-3);
}
.bar-track {
  display: flex;
  height: 30px;
  border-radius: var(--border-radius);
  overflow: hidden;
  gap: 2px;
}
.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  transition: opacity 0.3s ease;
  min-width: 0;
}
.bar-segment.is-active {
  opacity: 1;
}
.seg-label {
  font-size: 11px;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}
.score-indicator {
  position: absolute;
  bottom: -2px;
  transform: translateX(-50%);
  line-height: 1;
}
.indicator-arrow {
  font-size: 14px;
  color: var(--color-text-primary);
}

@media (max-width: 640px) {
  .bar-track {
    height: 24px;
  }
  .seg-label {
    font-size: 10px;
    padding: 0 3px;
  }
}

@media print {
  .bar-segment {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .bar-segment.is-active {
    opacity: 1;
  }
  .bar-segment:not(.is-active) {
    opacity: 0.4;
  }
}
</style>
