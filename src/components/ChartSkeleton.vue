<template>
  <view class="chart-skeleton" :style="{ height: height + 'px' }">
  </view>
</template>

<script setup>
defineProps({
  height: { type: Number, default: 200 }
})
</script>

<style scoped>
.chart-skeleton {
  width: 100%;
  background: linear-gradient(90deg, var(--color-surface-alt) 25%, var(--color-border) 50%, var(--color-surface-alt) 75%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-md);
  overflow: hidden;
}

@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .chart-skeleton {
    animation: none;
  }
}
</style>
