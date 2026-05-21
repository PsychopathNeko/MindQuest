<script setup>
defineProps({
  items: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <nav class="breadcrumb" aria-label="breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in items" :key="index" class="breadcrumb-item">
        <router-link v-if="item.to" :to="item.to" class="breadcrumb-link">{{ item.label }}</router-link>
        <span v-else class="breadcrumb-current" aria-current="page">{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="breadcrumb-sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  padding: var(--spacing-4) 0 0;
  max-width: 720px;
  margin: 0 auto;
}
.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: var(--font-size-sm);
}
.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.15s;
}
.breadcrumb-link:hover {
  text-decoration: underline;
}
.breadcrumb-current {
  color: var(--color-text-secondary);
}
.breadcrumb-sep {
  color: var(--color-text-secondary);
  opacity: 0.5;
  margin: 0 var(--spacing-1);
  user-select: none;
}
@media (max-width: 640px) {
  .breadcrumb { padding: var(--spacing-2) 0 0; }
  .breadcrumb-list { font-size: var(--font-size-xs); }
}
</style>
