<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <div class="report-layout">
    <div class="report-container">
      <div v-if="title || $slots.title" class="report-header">
        <slot name="title">
          <h1 class="report-title">{{ title }}</h1>
        </slot>
      </div>
      <div class="report-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-layout {
  padding: var(--spacing-4) 0 var(--spacing-12);
}

.report-container {
  max-width: 720px;
  margin: 0 auto;
}

.report-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.report-title {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.report-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

@media print {
  .report-layout {
    padding: 0;
  }

  .report-container {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .report-layout {
    padding: var(--spacing-2) 0 var(--spacing-8);
  }

  .report-header {
    margin-bottom: var(--spacing-6);
  }
}
</style>
