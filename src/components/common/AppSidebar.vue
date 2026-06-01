<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQueue } from '@/composables/useQueue'
import { useLocale } from '@/composables/useLocale'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useRecommendation } from '@/composables/useRecommendation'
import { useLocalizedRouter } from '@/composables/useLocalizedRouter'
import { getAssessments } from '@/utils/storage'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const router = useRouter()
const route = useRoute()
const { queue, removeFromQueue, clearQueue } = useQueue()
const { push: localizedPush } = useLocalizedRouter()
const showQueueClearConfirm = ref(false)
const { t, locale } = useLocale()
const { scales, loadIndex } = useScaleLoader()

const assessments = ref([])

function refreshAssessments() {
  assessments.value = getAssessments()
}

onMounted(() => {
  refreshAssessments()
  loadIndex()
})

// Refresh assessments when route changes (e.g., after completing assessment)
watch(() => route.path, refreshAssessments)

// Recommendation engine
const { recommendations } = useRecommendation(scales, assessments)
const topRecommendations = computed(() => recommendations.value.slice(0, 3))

// Stats
const totalCount = computed(() => assessments.value.length)
const recentAssessments = computed(() => assessments.value.slice(0, 3))

function relativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return t('sidebar.today')
  if (days === 1) return t('sidebar.yesterday')
  return t('sidebar.daysAgo', { days })
}

function formatShortDate(timestamp) {
  const d = new Date(timestamp)
  if (locale.value === 'en') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
  }
  return `${d.getMonth()+1}月${d.getDate()}日 ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

// Queue
const estimatedMinutes = computed(() => {
  return queue.value.reduce((sum, item) => sum + (item.estimatedMinutes || 5), 0)
})

function startScale(scaleId) {
  localizedPush({ name: 'scale-detail', params: { id: scaleId } })
  emit('close')
}

function startNext() {
  if (queue.value.length > 0) {
    startScale(queue.value[0].id)
  }
}

function viewReport(key, scaleId) {
  localizedPush({ name: 'report', params: { id: scaleId }, query: { key } })
  emit('close')
}

function viewAllHistory() {
  localizedPush({ name: 'history' })
  emit('close')
}

function goHome() {
  localizedPush({ name: 'home' })
  emit('close')
}
</script>
<template>
  <div v-if="open" class="sidebar-backdrop" @click="emit('close')" aria-hidden="true"></div>

  <aside class="app-sidebar" :class="{ open }">
    <!-- Section 1: Stats Overview -->
    <div class="sidebar-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 20V10"/>
          <path d="M12 20V4"/>
          <path d="M6 20v-6"/>
        </svg>
        <h3 class="section-title">{{ t('sidebar.stats') }}</h3>
      </div>
      <div class="stats-content">
        <div class="stat-row">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">{{ t('sidebar.completed', { count: totalCount }) }}</span>
        </div>
        <div v-if="assessments.length > 0" class="stat-row stat-last">
          <span class="stat-label-muted">{{ t('sidebar.lastAssessment') }}: {{ assessments[0].data.scaleName }} · {{ relativeTime(assessments[0].data.timestamp) }}</span>
        </div>
        <div v-else class="stats-empty">
          <p class="stat-label-muted">{{ t('sidebar.noAssessments') }}</p>
          <button class="btn-start-first" @click="goHome">{{ t('detail.startAssessment') }} →</button>
        </div>
      </div>
    </div>

    <!-- Section 2: Recent Assessments -->
    <div class="sidebar-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <h3 class="section-title">{{ t('sidebar.recent') }}</h3>
      </div>
      <div class="recent-list">
        <div v-if="recentAssessments.length === 0" class="section-empty">
          <p>{{ t('sidebar.noRecent') }}</p>
        </div>
        <div v-for="item in recentAssessments" :key="item.key" class="recent-item" tabindex="0" role="button" :aria-label="t('sidebar.viewReport') + ': ' + item.data.scaleName" @click="viewReport(item.key, item.data.scaleId)" @keydown.enter="viewReport(item.key, item.data.scaleId)" @keydown.space.prevent="viewReport(item.key, item.data.scaleId)">
          <div class="recent-info">
            <span class="recent-name">{{ item.data.scaleName }}</span>
            <span class="recent-date">{{ formatShortDate(item.data.timestamp) }}</span>
          </div>
          <span class="recent-arrow">→</span>
        </div>
        <button v-if="assessments.length > 3" class="btn-view-all" @click="viewAllHistory">
          {{ t('sidebar.viewAll') }} →
        </button>
      </div>
    </div>
    <!-- Section 3: Queue -->
    <div class="sidebar-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <h3 class="section-title">{{ t('sidebar.queueCount', { count: queue.length }) }}</h3>
      </div>

      <div v-if="queue.length === 0" class="section-empty">
        <p>{{ t('queue.emptyHint') }}</p>
      </div>

      <template v-else>
        <div class="queue-meta">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{{ t('sidebar.estimatedTime', { minutes: estimatedMinutes }) }}</span>
        </div>

        <div class="queue-list">
          <div v-for="(item, idx) in queue" :key="item.id" class="queue-item">
            <div class="queue-item-left">
              <span class="queue-number">{{ idx + 1 }}</span>
              <div class="queue-item-info">
                <span class="queue-name">{{ item.name }}</span>
              </div>
            </div>
            <div class="queue-item-actions">
              <button class="btn-icon btn-icon-start" @click="startScale(item.id)" :title="t('queue.start')" :aria-label="t('queue.start')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button class="btn-icon btn-icon-remove" @click="removeFromQueue(item.id)" :title="t('queue.remove')" :aria-label="t('queue.remove')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="queue-actions">
          <button class="btn-start-next" @click="startNext">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {{ t('sidebar.startNext') }}
          </button>
          <template v-if="!showQueueClearConfirm">
            <button class="btn-clear" @click="showQueueClearConfirm = true">{{ t('queue.clear') }}</button>
          </template>
          <template v-else>
            <button class="btn-clear btn-clear-confirm" @click="clearQueue(); showQueueClearConfirm = false">{{ t('history.confirmClear') }}</button>
            <button class="btn-clear" @click="showQueueClearConfirm = false">{{ t('history.cancel') }}</button>
          </template>
        </div>
      </template>
    </div>

    <!-- Section 4: Recommended Scales -->
    <div v-if="topRecommendations.length > 0" class="sidebar-section">
      <div class="section-header">
        <svg class="section-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <h3 class="section-title">{{ t('sidebar.recommended') }}</h3>
      </div>
      <div class="recommend-list">
        <div v-for="item in topRecommendations" :key="item.id" class="recommend-item" tabindex="0" role="button" :aria-label="item.name" @click="startScale(item.id)" @keydown.enter="startScale(item.id)" @keydown.space.prevent="startScale(item.id)">
          <div class="recommend-info">
            <span class="recommend-name">{{ item.name }}</span>
            <span class="recommend-meta">{{ item.questionCount }} {{ t('detail.questionUnit') }} · {{ item.estimatedMinutes }} {{ t('detail.minutes') }}</span>
          </div>
          <span class="recent-arrow">→</span>
        </div>
      </div>
    </div>

    <!-- Footer: Slogan + Author -->
    <div class="sidebar-footer">
      <p class="sidebar-slogan">{{ t('sidebar.slogan') }}</p>
      <div class="sidebar-author">
        <a href="https://psychopathneko.github.io/" target="_blank" rel="noopener noreferrer" class="author-link" :title="t('sidebar.personalWeb')">
          <svg class="author-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>psychopathneko</span>
        </a>
        <a href="mailto:xiaonan_guo@zju.edu.cn" class="author-link" :title="t('sidebar.email')">
          <svg class="author-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M22 4L12 13 2 4"/>
          </svg>
          <span>xiaonan_guo@zju.edu.cn</span>
        </a>
      </div>
    </div>
  </aside>
</template>
<style scoped>
.sidebar-backdrop {
  display: none;
}

.app-sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background-color: var(--color-background);
  border-right: 1px solid var(--color-pink-border);
  display: flex;
  flex-direction: column;
  z-index: 90;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Sections */
.sidebar-section {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-section:last-child {
  border-bottom: none;
  flex: 1;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.section-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.section-empty {
  padding: var(--spacing-3);
  text-align: center;
}

.section-empty p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  opacity: 0.7;
  line-height: 1.5;
  margin: 0;
}

/* Stats */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.stat-last {
  margin-top: var(--spacing-2);
}

.stat-label-muted {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  opacity: 0.7;
  line-height: 1.4;
}
.stats-empty {
  text-align: center;
  padding: var(--spacing-2) 0;
}

.btn-start-first {
  display: inline-block;
  margin-top: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-2xs);
  font-weight: 500;
  font-family: var(--font-family);
  color: var(--color-primary);
  background: none;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition);
}

.btn-start-first:hover {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

/* Recent */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.recent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition);
}

.recent-item:hover {
  background-color: rgba(125, 162, 247, 0.04);
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.recent-name {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-date {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.recent-arrow {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  opacity: 0.5;
  flex-shrink: 0;
}

.btn-view-all {
  display: block;
  width: 100%;
  padding: var(--spacing-2);
  margin-top: var(--spacing-1);
  font-size: var(--font-size-2xs);
  font-weight: 500;
  font-family: var(--font-family);
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: center;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition);
}

.btn-view-all:hover {
  background-color: rgba(125, 162, 247, 0.06);
}

/* Queue */
.queue-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-3);
  padding: var(--spacing-1) var(--spacing-2);
  background-color: rgba(125, 162, 247, 0.04);
  border-radius: var(--border-radius-sm);
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition);
}

.queue-item:hover {
  background-color: var(--color-surface);
}

.queue-item-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
  flex: 1;
}
.queue-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: var(--font-size-2xs);
  font-weight: 700;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-full);
  flex-shrink: 0;
}

.queue-item-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  min-width: 0;
}

.queue-name {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-item-actions {
  display: flex;
  gap: var(--spacing-1);
  flex-shrink: 0;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition);
  background: none;
}

.btn-icon-start {
  color: var(--color-primary);
}

.btn-icon-start:hover {
  background-color: rgba(125, 162, 247, 0.1);
}

.btn-icon-remove {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.btn-icon-remove:hover {
  color: var(--color-danger);
  opacity: 1;
  background-color: rgba(239, 68, 68, 0.06);
}

.queue-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.btn-start-next {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-family);
  color: var(--color-text-inverse);
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition);
}

.btn-start-next:hover {
  background-color: var(--color-primary-dark);
}

.btn-clear {
  width: 100%;
  padding: var(--spacing-1);
  font-size: var(--font-size-2xs);
  font-weight: 500;
  font-family: var(--font-family);
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color var(--transition);
  opacity: 0.6;
}

.btn-clear:hover {
  color: var(--color-danger);
  opacity: 1;
}

.btn-clear-confirm {
  color: var(--color-danger);
  opacity: 1;
  font-weight: 600;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

.sidebar-slogan {
  font-size: var(--font-size-xs);
  font-style: italic;
  color: var(--color-text-secondary);
  opacity: 0.7;
  line-height: 1.5;
  margin: 0 0 var(--spacing-3) 0;
  text-align: center;
}

.sidebar-author {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.author-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition);
  overflow: hidden;
}

.author-link:hover {
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.06);
}

.author-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.author-link:hover .author-icon {
  opacity: 1;
}

@media (max-width: 640px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: none;
    background-color: var(--color-surface);
    width: min(var(--sidebar-width), 85vw);
  }

  .app-sidebar.open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    top: var(--header-height);
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 89;
  }

  .sidebar-footer {
    padding: var(--spacing-3);
  }

  .sidebar-slogan {
    font-size: var(--font-size-2xs);
  }

  .author-link {
    font-size: 10px;
  }

  .author-link span {
    min-width: 0;
  }
}
/* Recommended */
.recommend-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.recommend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition);
}

.recommend-item:hover {
  background-color: rgba(125, 162, 247, 0.04);
}

.recommend-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.recommend-name {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-meta {
  font-size: var(--font-size-2xs);
  color: var(--color-text-secondary);
  opacity: 0.7;
}

/* Focus indicators */
.btn-icon:focus-visible,
.btn-view-all:focus-visible,
.btn-start-first:focus-visible,
.btn-start-next:focus-visible,
.btn-clear:focus-visible,
.recent-item:focus-visible,
.recommend-item:focus-visible,
.author-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
