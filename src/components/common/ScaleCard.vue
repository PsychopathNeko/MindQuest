<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  scale: {
    type: Object,
    required: true,
  },
})

const router = useRouter()

function navigateToScale() {
  router.push({ name: 'scale-detail', params: { id: props.scale.id } })
}
</script>

<template>
  <article class="scale-card card" @click="navigateToScale" role="button" tabindex="0" @keydown.enter="navigateToScale">
    <div class="card-header">
      <span class="short-name-badge">{{ scale.shortName }}</span>
      <span class="license-badge">{{ scale.license }}</span>
    </div>
    <h3 class="card-title">{{ scale.name }}</h3>
    <p class="card-description">{{ scale.description }}</p>
    <div class="card-tags">
      <span v-for="tagId in scale.tags" :key="tagId" class="card-tag">
        {{ tagId }}
      </span>
    </div>
    <div class="card-meta">
      <span class="meta-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ scale.questionCount }} 题
      </span>
      <span class="meta-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        约 {{ scale.estimatedMinutes }} 分钟
      </span>
    </div>
  </article>
</template>

<style scoped>
.scale-card {
  padding: var(--spacing-6);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  transition: transform var(--transition), box-shadow var(--transition);
}

.scale-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.scale-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.short-name-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary);
  background-color: rgba(99, 102, 241, 0.08);
  border-radius: var(--border-radius-full);
  letter-spacing: 0.02em;
}

.license-badge {
  font-size: 10px;
  color: var(--color-text-secondary);
  opacity: 0.6;
  font-weight: 500;
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.card-tag {
  display: inline-flex;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-secondary);
  background-color: rgba(139, 92, 246, 0.08);
  border-radius: var(--border-radius-full);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-top: auto;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
</style>
