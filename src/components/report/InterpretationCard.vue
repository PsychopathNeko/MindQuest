<script setup>
import { computed } from 'vue'
import { getSeverityColor } from '@/engine/reportEngine'
import { useLocale } from '@/composables/useLocale'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  level: { type: String, default: '' },
})

const { t } = useLocale()

const displayTitle = computed(() => props.title || t('interpretation.defaultTitle'))

const borderColor = computed(() => getSeverityColor(props.level))

const iconSymbol = computed(() => {
  switch (props.level) {
    case 'minimal':
    case 'normal':
      return '✓'
    case 'mild':
      return 'i'
    case 'moderate':
      return '!'
    case 'severe':
    case 'extremely_severe':
      return '⚠'
    default:
      return 'i'
  }
})

const iconClass = computed(() => {
  switch (props.level) {
    case 'minimal':
    case 'normal':
      return 'icon-check'
    case 'mild':
      return 'icon-info'
    case 'moderate':
      return 'icon-warning'
    case 'severe':
    case 'extremely_severe':
      return 'icon-alert'
    default:
      return 'icon-info'
  }
})
</script>

<template>
  <div class="interpretation-card" :style="{ borderLeftColor: borderColor }">
    <div class="card-header">
      <span class="card-icon" :class="iconClass" :style="{ backgroundColor: borderColor }">
        {{ iconSymbol }}
      </span>
      <h3 class="card-title">{{ displayTitle }}</h3>
    </div>
    <p v-if="description" class="card-description">{{ description }}</p>
  </div>
</template>

<style scoped>
.interpretation-card { background-color: var(--color-surface); border-radius: var(--border-radius); border: 1px solid var(--color-border); border-left: 4px solid #6b7280; padding: var(--spacing-4) var(--spacing-6); box-shadow: var(--shadow-sm); }
.card-header { display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-3); }
.card-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--border-radius-full); color: var(--color-text-inverse); font-size: var(--font-size-xs); font-weight: 700; flex-shrink: 0; }
.card-title { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); margin: 0; }
.card-description { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.7; margin: 0; }
</style>
