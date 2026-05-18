<script setup>
defineProps({
  suggestions: { type: Array, default: () => [] },
})
</script>

<template>
  <div v-if="suggestions && suggestions.length > 0" class="suggestion-card">
    <h3 class="suggestion-title">建议</h3>
    <ul class="suggestion-list">
      <li v-for="(item, index) in suggestions" :key="index" class="suggestion-item">
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.suggestion-card {
  background-color: #f0fdf4;
  border-radius: var(--border-radius);
  border: 1px solid #bbf7d0;
  padding: var(--spacing-4) var(--spacing-6);
}

.suggestion-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: #166534;
  margin: 0 0 var(--spacing-3);
}

.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.suggestion-item {
  font-size: var(--font-size-sm);
  color: #15803d;
  line-height: 1.6;
  padding-left: var(--spacing-4);
  position: relative;
}

.suggestion-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 6px;
  height: 6px;
  border-radius: var(--border-radius-full);
  background-color: #86efac;
}
</style>
