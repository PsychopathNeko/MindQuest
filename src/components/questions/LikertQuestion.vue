<script setup>
defineProps({
  question: {
    type: Object,
    required: true,
  },
  choices: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

function select(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="likert-question">
    <p class="question-text">{{ question.text }}</p>
    <div class="choices-stack">
      <button
        v-for="choice in choices"
        :key="choice.value"
        class="choice-card"
        :class="{ selected: modelValue === choice.value }"
        @click="select(choice.value)"
        type="button"
      >
        <span class="choice-value">{{ choice.value }}</span>
        <span class="choice-label">{{ choice.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.likert-question {
  width: 100%;
}

.question-text {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin-bottom: var(--spacing-6);
}

.choices-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.choice-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  width: 100%;
  min-height: 56px;
  padding: var(--spacing-4) var(--spacing-4);
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: var(--font-family);
}

.choice-card:hover {
  border-color: var(--color-primary-light);
  background-color: rgba(125, 162, 247, 0.04);
}

.choice-card:active {
  transform: scale(0.98);
}

.choice-card.selected {
  border-color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.08);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.choice-value {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-full);
  background-color: var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.choice-card.selected .choice-value {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.choice-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.choice-card.selected .choice-label {
  color: var(--color-primary-dark);
}

@media (max-width: 640px) {
  .question-text {
    font-size: var(--font-size-lg);
  }

  .choice-card {
    min-height: 48px;
    padding: var(--spacing-3) var(--spacing-4);
  }
}

.choice-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
