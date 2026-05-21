<script setup>
import { ref, computed, watch, onMounted, onServerPrefetch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useLocale } from '@/composables/useLocale'
import { useQueue } from '@/composables/useQueue'
import { useHead } from '@unhead/vue'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'

const route = useRoute()
const router = useRouter()
const { loading, error, loadScale } = useScaleLoader()
const { t, locale } = useLocale()
const { addToQueue, isInQueue } = useQueue()

const scale = ref(null)
const scaleId = computed(() => route.params.id)

useHead({
  title: computed(() =>
    scale.value
      ? `${scale.value.meta.name} - MindQuest`
      : 'MindQuest'
  ),
  meta: [
    {
      name: 'description',
      content: computed(() =>
        scale.value ? scale.value.meta.description : ''
      ),
    },
    {
      property: 'og:title',
      content: computed(() =>
        scale.value
          ? `${scale.value.meta.name} - MindQuest`
          : 'MindQuest'
      ),
    },
    {
      property: 'og:description',
      content: computed(() =>
        scale.value ? scale.value.meta.description : ''
      ),
    },
    { property: 'og:url', content: computed(() => `https://psychopathneko.github.io/MindQuest/scale/${scaleId.value}`) },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: computed(() => scale.value ? `${scale.value.meta.name} - MindQuest` : 'MindQuest') },
    { name: 'twitter:description', content: computed(() => scale.value ? scale.value.meta.description : '') },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!scale.value) return ''
        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'MindQuest',
              'item': 'https://psychopathneko.github.io/MindQuest/'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': scale.value.meta.name,
              'item': `https://psychopathneko.github.io/MindQuest/scale/${scaleId.value}`
            }
          ]
        })
      })
    }
  ],
})

onServerPrefetch(async () => {
  try {
    const data = await loadScale(scaleId.value)
    scale.value = data
  } catch (e) {
    // SSG will render loading state; client will hydrate and retry
  }
})

onMounted(async () => {
  if (!scale.value) {
    const data = await loadScale(scaleId.value)
    scale.value = data
  }
})

watch(scaleId, async (newId) => {
  if (newId) {
    const data = await loadScale(newId)
    scale.value = data
  }
})

watch(locale, async () => {
  if (scaleId.value) {
    const data = await loadScale(scaleId.value)
    scale.value = data
  }
})

function startAssessment() {
  router.push({ name: 'assessment', params: { id: scaleId.value } })
}

function goHome() {
  router.push({ name: 'home' })
}

function estimateTime(questionCount) {
  if (!Number.isFinite(questionCount) || questionCount <= 0) return '1 - 2'
  const minutes = Math.max(1, Math.ceil(questionCount * 0.4))
  return String(minutes) + ' - ' + String(minutes + Math.ceil(minutes * 0.5))
}

const breadcrumbItems = computed(() => [
  { label: t('nav.home'), to: { name: 'home' } },
  { label: scale.value?.meta?.name || '...' }
])

function handleAddToQueue() {
  if (!scale.value) return
  addToQueue({
    id: scale.value.meta.id,
    name: scale.value.meta.name,
    shortName: scale.value.meta.id.toUpperCase(),
    estimatedMinutes: scale.value.questions ? Math.max(1, Math.ceil(scale.value.questions.length * 0.4)) : 5
  })
}
</script>
<template>
  <div class="scale-detail-view">
    <div class="container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('detail.loading') }}</p>
      </div>

      <div v-else-if="error || !scale" class="error-state">
        <div class="error-icon">!</div>
        <p class="error-text">{{ error || t('detail.loadError') }}</p>
        <button class="btn btn-primary" @click="goHome">{{ t('detail.backHome') }}</button>
      </div>

      <template v-else>
        <BreadcrumbNav :items="breadcrumbItems" />
        <div class="detail-card card">
          <div class="detail-header">
            <div class="name-row">
              <h1 class="scale-name">{{ scale.meta.name }}</h1>
              <span class="scale-badge">{{ scale.meta.id.toUpperCase() }}</span>
            </div>
            <p class="scale-fullname">{{ scale.meta.fullName }}</p>
          </div>
          <div class="detail-section">
            <p class="scale-description">{{ scale.meta.description }}</p>
          </div>
          <div class="detail-section instruction-section">
            <p class="meta-label">{{ t('detail.instruction') }}</p>
            <div class="instruction-box"><p class="instruction-text">{{ scale.meta.instruction }}</p></div>
          </div>
          <div class="detail-section meta-grid">
            <div class="meta-item"><span class="meta-label">{{ t('detail.author') }}</span><span class="meta-value">{{ scale.meta.author }}</span></div>
            <div v-if="scale.meta.population" class="meta-item"><span class="meta-label">{{ t('detail.population') }}</span><span class="meta-value">{{ scale.meta.population }}</span></div>
            <div class="meta-item"><span class="meta-label">{{ t('detail.questionCount') }}</span><span class="meta-value">{{ scale.questions.length }} {{ t('detail.questionUnit') }}</span></div>
            <div class="meta-item"><span class="meta-label">{{ t('detail.estimatedTime') }}</span><span class="meta-value">{{ estimateTime(scale.questions.length) }} {{ t('detail.minutes') }}</span></div>
          </div>
          <div class="detail-section">
            <p class="meta-label">{{ t('detail.reference') }}</p>
            <p class="reference-text">{{ scale.meta.reference }}</p>
          </div>
          <div class="detail-actions">
            <button class="btn btn-outline" @click="goHome">{{ t('detail.backHome') }}</button>
            <div class="action-right">
              <button
                class="btn btn-outline"
                :class="{ 'btn-added': isInQueue(scaleId) }"
                :disabled="isInQueue(scaleId)"
                @click="handleAddToQueue"
              >
                {{ isInQueue(scaleId) ? '✓ ' + t('card.addToQueue') : t('card.addToQueue') }}
              </button>
              <button class="btn btn-primary btn-lg" @click="startAssessment">{{ t('detail.startAssessment') }}</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scale-detail-view { padding: var(--spacing-8) 0 var(--spacing-12); }
.detail-card { max-width: 720px; margin: 0 auto; padding: var(--spacing-8); }
.detail-header { margin-bottom: var(--spacing-6); }
.name-row { display: flex; align-items: center; gap: var(--spacing-3); flex-wrap: wrap; margin-bottom: var(--spacing-2); }
.scale-name { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary); }
.scale-badge { display: inline-flex; align-items: center; padding: var(--spacing-1) var(--spacing-3); font-size: var(--font-size-xs); font-weight: 600; color: var(--color-secondary); background-color: rgba(232, 160, 191, 0.12); border-radius: var(--border-radius-full); letter-spacing: 0.5px; }
.scale-fullname { font-size: var(--font-size-sm); color: var(--color-text-secondary); font-style: italic; }
.detail-section { padding: var(--spacing-4) 0; border-top: 1px solid var(--color-border); }
.scale-description { font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 1.7; }
.meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-4); }
.meta-item { display: flex; flex-direction: column; gap: var(--spacing-1); }
.meta-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--spacing-1); }
.meta-value { font-size: var(--font-size-base); color: var(--color-text-primary); font-weight: 500; }
.reference-text { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.6; }
.instruction-box { padding: var(--spacing-4); background-color: rgba(125, 162, 247, 0.05); border-radius: var(--border-radius-sm); border-left: 3px solid var(--color-primary); }
.instruction-text { font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 1.6; }
.detail-actions { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-4); margin-top: var(--spacing-8); padding-top: var(--spacing-6); border-top: 1px solid var(--color-border); }
.btn-lg { padding: var(--spacing-3) var(--spacing-8); font-size: var(--font-size-base); font-weight: 600; }
.error-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4); padding: var(--spacing-12) 0; text-align: center; }
.error-icon { width: 48px; height: 48px; border-radius: var(--border-radius-full); background-color: rgba(239, 68, 68, 0.1); color: var(--color-danger); font-size: var(--font-size-xl); font-weight: 700; display: flex; align-items: center; justify-content: center; }
.error-text { color: var(--color-danger); font-size: var(--font-size-base); }
.action-right { display: flex; gap: var(--spacing-3); align-items: center; }
.btn-added { color: var(--color-success); border-color: var(--color-success); opacity: 0.7; cursor: default; }
@media (max-width: 640px) {
  .detail-card { padding: var(--spacing-6); }
  .meta-grid { grid-template-columns: 1fr; }
  .detail-actions { flex-direction: column-reverse; }
  .detail-actions .btn { width: 100%; }
  .action-right { flex-direction: column; width: 100%; }
  .action-right .btn { width: 100%; }
}
</style>
