<script setup>
import { useLocale } from '@/composables/useLocale'

defineProps({
  question: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useLocale()

function select(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="yesno-question">
    <p class="question-text">{{ question.text }}</p>
    <div class="yesno-buttons">
      <button
        type="button"
        class="yesno-btn yes-btn"
        :class="{ selected: modelValue === 1 }"
        @click="select(1)"
      >
        {{ t('yesno.yes') }}
      </button>
      <button
        type="button"
        class="yesno-btn no-btn"
        :class="{ selected: modelValue === 0 }"
        @click="select(0)"
      >
        {{ t('yesno.no') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.yesno-question { width: 100%; }
.question-text { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text-primary); line-height: 1.5; margin-bottom: var(--spacing-6); }
.yesno-buttons { display: flex; gap: var(--spacing-4); }
.yesno-btn { flex: 1; min-height: 64px; font-size: var(--font-size-lg); font-weight: 600; font-family: var(--font-family); border: 2px solid var(--color-border); border-radius: var(--border-radius); background-color: var(--color-surface); color: var(--color-text-primary); cursor: pointer; transition: all 0.2s ease; }
.yesno-btn:hover { border-color: var(--color-primary-light); background-color: rgba(125, 162, 247, 0.04); }
.yesno-btn:active { transform: scale(0.97); }
.yesno-btn.selected { border-color: var(--color-primary); background-color: rgba(125, 162, 247, 0.08); color: var(--color-primary-dark); box-shadow: 0 0 0 1px var(--color-primary); }
.yes-btn.selected { border-color: var(--color-success); background-color: rgba(16, 185, 129, 0.08); color: var(--color-success); box-shadow: 0 0 0 1px var(--color-success); }
.no-btn.selected { border-color: var(--color-danger); background-color: rgba(239, 68, 68, 0.08); color: var(--color-danger); box-shadow: 0 0 0 1px var(--color-danger); }
@media (max-width: 640px) {
  .question-text { font-size: var(--font-size-lg); }
  .yesno-btn { min-height: 56px; }
}
</style>
