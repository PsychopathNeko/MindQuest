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
  <div class="single-choice-question">
    <p class="question-text">{{ question.text }}</p>
    <div class="radio-group">
      <label
        v-for="choice in choices"
        :key="choice.value"
        class="radio-option"
        :class="{ selected: modelValue === choice.value }"
      >
        <input
          type="radio"
          :name="`question-${question.index}`"
          :value="choice.value"
          :checked="modelValue === choice.value"
          @change="select(choice.value)"
          class="radio-input"
        />
        <span class="radio-indicator"></span>
        <span class="radio-label">{{ choice.label }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.single-choice-question {
  width: 100%;
}

.question-text {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin-bottom: var(--spacing-6);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
}

.radio-option:hover {
  border-color: var(--color-primary-light);
  background-color: rgba(99, 102, 241, 0.04);
}

.radio-option.selected {
  border-color: var(--color-primary);
  background-color: rgba(99, 102, 241, 0.08);
}

.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-indicator {
  width: 20px;
  height: 20px;
  border-radius: var(--border-radius-full);
  border: 2px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.radio-option.selected .radio-indicator {
  border-color: var(--color-primary);
}

.radio-option.selected .radio-indicator::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 10px;
  height: 10px;
  border-radius: var(--border-radius-full);
  background-color: var(--color-primary);
}

.radio-label {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.radio-option.selected .radio-label {
  color: var(--color-primary-dark);
}

@media (max-width: 640px) {
  .question-text {
    font-size: var(--font-size-lg);
  }
}
</style>
