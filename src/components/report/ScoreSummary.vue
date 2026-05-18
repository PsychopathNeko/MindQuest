<script setup>
defineProps({
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  label: { type: String, default: '' },
  level: { type: String, default: '' },
  color: { type: String, default: '#6b7280' },
})
</script>

<template>
  <div class="score-summary">
    <div class="score-display">
      <span class="score-value" :style="{ color }">{{ score }}</span>
      <span class="score-separator">/</span>
      <span class="score-max">{{ maxScore }}</span>
    </div>
    <div v-if="label" class="severity-badge" :style="{ backgroundColor: color }">
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
.score-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6) var(--spacing-4);
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
}

.score-value {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  line-height: 1;
}

.score-separator {
  font-size: var(--font-size-2xl);
  font-weight: 300;
  color: var(--color-text-secondary);
}

.score-max {
  font-size: var(--font-size-2xl);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-4);
  border-radius: var(--border-radius-full);
  color: var(--color-text-inverse);
  font-size: var(--font-size-sm);
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
