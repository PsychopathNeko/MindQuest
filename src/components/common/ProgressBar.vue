<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

const percentage = computed(() => {
  if (props.total <= 0) return 0
  return Math.round((props.current / props.total) * 100)
})
</script>

<template>
  <div class="progress-bar-wrapper">
    <div class="progress-info">
      <span class="progress-text">第 {{ current }} / {{ total }} 题</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ width: percentage + '%' }"
        role="progressbar"
        :aria-valuenow="current"
        :aria-valuemin="0"
        :aria-valuemax="total"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar-wrapper {
  width: 100%;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.progress-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.progress-percentage {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
}

.progress-track {
  width: 100%;
  height: 8px;
  background-color: var(--color-border);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--border-radius-full);
  transition: width 0.3s ease;
  min-width: 0;
}
</style>
