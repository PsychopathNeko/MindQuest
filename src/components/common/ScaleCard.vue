<script setup>
import { useRouter } from 'vue-router'
import { useQueue } from '@/composables/useQueue'
import { useLocale } from '@/composables/useLocale'

const props = defineProps({
  scale: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { addToQueue, isInQueue } = useQueue()
const { t } = useLocale()

function navigateToScale() {
  router.push({ name: 'scale-detail', params: { id: props.scale.id } })
}

function handleAddToQueue(e) {
  e.stopPropagation()
  addToQueue({ id: props.scale.id, name: props.scale.name, shortName: props.scale.shortName, estimatedMinutes: props.scale.estimatedMinutes })
}

function handleStart(e) {
  e.stopPropagation()
  navigateToScale()
}
</script>

<template>
  <article class="scale-card card" @click="navigateToScale" role="button" tabindex="0" @keydown.enter="navigateToScale">
    <div class="card-header">
      <span class="short-name-badge">{{ scale.shortName }}</span>
    </div>
    <h3 class="card-title">{{ scale.name }}</h3>
    <p class="card-description">{{ scale.description }}</p>
    <div class="card-tags">
      <span v-for="tag in scale.resolvedTags" :key="tag.id" class="card-tag">
        {{ tag.label }}
      </span>
    </div>
    <div class="card-meta">
      <span class="meta-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ t('card.questions', { count: scale.questionCount }) }}
      </span>
      <span class="meta-item">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        {{ t('card.minutes', { count: scale.estimatedMinutes }) }}
      </span>
    </div>
    <div class="card-actions">
      <button class="btn-card btn-card-start" @click="handleStart">{{ t('card.start') }}</button>
      <button
        class="btn-card btn-card-queue"
        :class="{ 'btn-card-added': isInQueue(scale.id) }"
        @click="handleAddToQueue"
        :disabled="isInQueue(scale.id)"
      >
        {{ isInQueue(scale.id) ? '✓' : t('card.addToQueue') }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.scale-card { padding: var(--spacing-6); cursor: pointer; display: flex; flex-direction: column; gap: var(--spacing-3); transition: transform var(--transition), box-shadow var(--transition); }
.scale-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: rgba(232, 160, 191, 0.3); background: linear-gradient(to bottom, var(--color-surface) 85%, rgba(125, 162, 247, 0.03) 100%); }
.scale-card:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.short-name-badge { display: inline-flex; align-items: center; padding: 2px 10px; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-secondary); background-color: rgba(232, 160, 191, 0.12); border-radius: var(--border-radius-full); letter-spacing: 0.02em; }
.card-title { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-primary); line-height: 1.3; }
.card-description { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-tags { display: flex; flex-wrap: wrap; gap: var(--spacing-1); }
.card-tag { display: inline-flex; padding: 1px 8px; font-size: 11px; font-weight: 500; color: var(--color-secondary); background-color: rgba(232, 160, 191, 0.1); border-radius: var(--border-radius-full); }
.card-meta { display: flex; align-items: center; gap: var(--spacing-4); padding-top: var(--spacing-2); border-top: 1px solid var(--color-border); }
.meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: var(--font-size-xs); color: var(--color-text-secondary); }
.card-actions { display: flex; gap: var(--spacing-2); margin-top: auto; padding-top: var(--spacing-2); }
.btn-card { padding: 4px 12px; font-size: var(--font-size-xs); font-weight: 500; font-family: var(--font-family); border: 1px solid; border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition); }
.btn-card-start { background-color: var(--color-primary); color: var(--color-text-inverse); border-color: var(--color-primary); }
.btn-card-start:hover { background-color: var(--color-primary-dark); }
.btn-card-queue { background-color: transparent; color: var(--color-text-secondary); border-color: var(--color-border); }
.btn-card-queue:hover { color: var(--color-primary); border-color: var(--color-primary-light); }
.btn-card-added { color: var(--color-success); border-color: var(--color-success); cursor: default; opacity: 0.7; }
.btn-card-added:hover { color: var(--color-success); border-color: var(--color-success); }

@media (max-width: 640px) {
  .scale-card { padding: var(--spacing-4); gap: var(--spacing-2); }
  .btn-card { padding: 8px 14px; font-size: var(--font-size-xs); min-height: 44px; }
  .card-actions { gap: var(--spacing-3); }
  .card-title { font-size: var(--font-size-sm); }
}
</style>
