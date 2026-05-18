<script setup>
import LikertQuestion from './LikertQuestion.vue'
import SingleChoiceQuestion from './SingleChoiceQuestion.vue'
import YesNoQuestion from './YesNoQuestion.vue'
import { computed } from 'vue'

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  choices: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const questionComponent = computed(() => {
  switch (props.question?.type) {
    case 'single':
      return SingleChoiceQuestion
    case 'yesno':
      return YesNoQuestion
    case 'likert':
    default:
      return LikertQuestion
  }
})

function onUpdate(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <component
    :is="questionComponent"
    :question="question"
    :choices="choices"
    :model-value="modelValue"
    @update:model-value="onUpdate"
  />
</template>
