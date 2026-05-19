<script setup>
import { useLocale } from '@/composables/useLocale'

defineProps({
  tags: {
    type: Array,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['toggle', 'clear'])
const { t } = useLocale()
</script>

<template>
  <div class="tag-filter">
    <button
      class="tag-chip"
      :class="{ active: selectedTags.length === 0 }"
      @click="emit('clear')"
    >
      {{ t('filter.all') }}
    </button>
    <button
      v-for="tag in tags"
      :key="tag.id"
      class="tag-chip"
      :class="{ active: selectedTags.includes(tag.id) }"
      @click="emit('toggle', tag.id)"
    >
      {{ tag.label }}
    </button>
  </div>
</template>

<style scoped>
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
}

@media (max-width: 640px) {
  .tag-filter {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: var(--spacing-2);
  }

  .tag-filter::-webkit-scrollbar {
    display: none;
  }
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition);
  user-select: none;
}

.tag-chip:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.04);
}

.tag-chip.active {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.tag-chip.active:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}
</style>
