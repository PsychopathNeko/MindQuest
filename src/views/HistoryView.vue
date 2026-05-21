<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHistory } from '@/composables/useHistory'
import { exportAllData, importData } from '@/utils/storage'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useLocale } from '@/composables/useLocale'
import { getSeverityColor } from '@/engine/reportEngine'

const router = useRouter()
const { records, loading, loadRecords, removeRecord, clearAll, formatDate } = useHistory()
const { t } = useLocale()
const { scales, tagGroups, loadIndex: loadScaleIndex } = useScaleLoader()

const selectedGroup = ref('')
const showClearConfirm = ref(false)
const pendingDeleteKey = ref(null)
const fileInput = ref(null)
const importMessage = ref('')

// No onServerPrefetch: history data comes from localStorage which is empty during SSG
onMounted(() => { loadRecords(); loadScaleIndex() })

function viewReport(record) {
  router.push({ name: 'report', params: { id: record.data.scaleId }, query: { key: record.key } })
}
function confirmDelete(key) { pendingDeleteKey.value = key }
function cancelDelete() { pendingDeleteKey.value = null }
function executeDelete() { if (pendingDeleteKey.value) { removeRecord(pendingDeleteKey.value); pendingDeleteKey.value = null } }
function confirmClearAll() { showClearConfirm.value = true }
function cancelClearAll() { showClearConfirm.value = false }
function executeClearAll() { clearAll(); showClearConfirm.value = false }
function goHome() { router.push({ name: 'home' }) }
function selectGroup(groupId) { selectedGroup.value = selectedGroup.value === groupId ? '' : groupId }

function handleExport() {
  const data = exportAllData()
  const parsed = JSON.parse(data)
  if (!parsed.assessments.length) {
    importMessage.value = t('history.noData')
    setTimeout(() => { importMessage.value = '' }, 3000)
    return
  }
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mindquest-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  importMessage.value = t('history.exportSuccess', { count: parsed.assessments.length })
  setTimeout(() => { importMessage.value = '' }, 3000)
}

function triggerImport() {
  fileInput.value?.click()
}

function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const result = importData(e.target.result)
      loadRecords()
      importMessage.value = t('history.importSuccess', { imported: result.imported, skipped: result.skipped })
    } catch {
      importMessage.value = t('history.importError')
    }
    setTimeout(() => { importMessage.value = '' }, 5000)
  }
  reader.readAsText(file)
  event.target.value = ''
}

const scaleTagMap = computed(() => {
  const m = new Map()
  if (scales.value) {
    for (const s of scales.value) {
      m.set(s.id, s.tags || [])
    }
  }
  return m
})

const groupRecordCounts = computed(() => {
  const counts = {}
  if (!records.value || !tagGroups.value || tagGroups.value.length === 0) return counts
  for (const g of tagGroups.value) {
    const groupTagIds = new Set(g.tags.map(t => t.id))
    counts[g.id] = records.value.filter(r => {
      const scaleTags = scaleTagMap.value.get(r.data?.scaleId) || []
      return scaleTags.some(t => groupTagIds.has(t))
    }).length
  }
  return counts
})

const filteredRecords = computed(() => {
  if (!selectedGroup.value || tagGroups.value.length === 0) return records.value
  const group = tagGroups.value.find((g) => g.id === selectedGroup.value)
  if (!group) return records.value
  const groupTagIds = new Set(group.tags.map((t) => t.id))
  return records.value.filter((r) => {
    const scaleTags = scaleTagMap.value.get(r.data?.scaleId) || []
    return scaleTags.some((t) => groupTagIds.has(t))
  })
})

function getBorderColor(record) { const level = record.data?.report?.level; return level ? getSeverityColor(level) : '#e2e8f0' }
function getLevelLabel(record) { return record.data?.report?.label ?? '--' }
function getLevelColor(record) { const level = record.data?.report?.level; return level ? getSeverityColor(level) : '#6b7280' }
function getTotalScore(record) { const total = record.data?.scores?.total; return total != null ? total : '--' }
function getSubscales(record) { const subs = record.data?.report?.subscaleReports; if (!subs || subs.length === 0) return null; return subs }
</script>
<template>
  <div class="history-view">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">{{ t('history.title') }}</h1>
        <p class="page-subtitle">{{ t('history.subtitle') }}</p>
      </div>

      <!-- Group Filter -->
      <div v-if="tagGroups.length > 0 && records.length > 0" class="group-filter">
        <button class="tag-chip" :class="{ active: selectedGroup === '' }" @click="selectedGroup = ''">{{ t('filter.allGroups') }}</button>
        <button v-for="g in tagGroups" :key="g.id" class="tag-chip" :class="{ active: selectedGroup === g.id }" @click="selectGroup(g.id)">
          {{ g.label }}
          <span v-if="groupRecordCounts[g.id]" class="chip-count">{{ groupRecordCounts[g.id] }}</span>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('history.loading') }}</p>
      </div>

      <div v-else-if="records.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </div>
        <p class="empty-text">{{ t('history.empty') }}</p>
        <p class="empty-hint">{{ t('history.emptyHint') }}</p>
        <button class="btn btn-primary" @click="goHome">{{ t('history.startAssessment') }}</button>
      </div>

      <template v-else>
        <div class="records-list">
          <div v-for="record in filteredRecords" :key="record.key" class="record-card card" :style="{ borderLeftColor: getBorderColor(record) }">
            <div class="record-body">
              <div class="record-header">
                <h3 class="record-name">{{ record.data.scaleName }}</h3>
                <span class="record-date">{{ formatDate(record.data.timestamp) }}</span>
              </div>
              <div class="record-scores">
                <div class="score-main">
                  <span class="score-label">{{ t('history.totalScore') }}</span>
                  <span class="score-value">{{ getTotalScore(record) }}</span>
                </div>
                <div class="severity-badge" :style="{ backgroundColor: getLevelColor(record) + '18', color: getLevelColor(record) }">{{ getLevelLabel(record) }}</div>
              </div>
              <div v-if="getSubscales(record)" class="subscale-list">
                <span v-for="sub in getSubscales(record)" :key="sub.id" class="subscale-tag" :style="{ borderColor: getSeverityColor(sub.level) + '40', color: getSeverityColor(sub.level) }">
                  {{ sub.name }}: {{ sub.score }}{{ t('history.scoreSuffix') }} ({{ sub.label }})
                </span>
              </div>
              <div class="record-actions">
                <button class="btn btn-primary btn-action" @click="viewReport(record)">{{ t('history.viewReport') }}</button>
                <button v-if="pendingDeleteKey !== record.key" class="btn btn-ghost btn-action btn-delete" @click="confirmDelete(record.key)">{{ t('history.delete') }}</button>
                <template v-else>
                  <button class="btn btn-danger-solid btn-action" @click="executeDelete">{{ t('history.confirmDelete') }}</button>
                  <button class="btn btn-ghost btn-action" @click="cancelDelete">{{ t('history.cancel') }}</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="data-actions">
          <button class="btn btn-outline btn-data" @click="handleExport">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ t('history.export') }}
          </button>
          <button class="btn btn-outline btn-data" @click="triggerImport">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ t('history.import') }}
          </button>
          <input ref="fileInput" type="file" accept=".json" style="display:none" @change="handleImportFile" />
          <p v-if="importMessage" class="data-message">{{ importMessage }}</p>
        </div>

        <div class="clear-section">
          <template v-if="!showClearConfirm">
            <button class="btn btn-ghost btn-clear" @click="confirmClearAll">{{ t('history.clearAll') }}</button>
          </template>
          <template v-else>
            <div class="clear-confirm">
              <p class="clear-confirm-text">{{ t('history.clearConfirm') }}</p>
              <div class="clear-confirm-buttons">
                <button class="btn btn-danger-solid" @click="executeClearAll">{{ t('history.confirmClear') }}</button>
                <button class="btn btn-outline" @click="cancelClearAll">{{ t('history.cancel') }}</button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.history-view { padding: var(--spacing-6) 0 var(--spacing-12); }
.page-header { text-align: center; padding: var(--spacing-8) 0 var(--spacing-6); }
.page-title { font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: var(--spacing-2); }
.page-subtitle { font-size: var(--font-size-base); color: var(--color-text-secondary); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-3); padding: var(--spacing-12) 0; text-align: center; }
.empty-icon { color: var(--color-border); margin-bottom: var(--spacing-2); }
.empty-text { font-size: var(--font-size-xl); font-weight: 600; color: var(--color-text-primary); }
.empty-hint { font-size: var(--font-size-sm); color: var(--color-text-secondary); max-width: 300px; line-height: 1.6; }
.empty-state .btn { margin-top: var(--spacing-3); }
.records-list { display: flex; flex-direction: column; gap: var(--spacing-4); max-width: 720px; margin: 0 auto; }
.record-card { border-left: 4px solid var(--color-border); transition: box-shadow var(--transition), transform var(--transition); }
.record-card:hover { box-shadow: var(--shadow-md); }
.record-body { padding: var(--spacing-4) var(--spacing-6); }
.record-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--spacing-3); margin-bottom: var(--spacing-3); }
.record-name { font-size: var(--font-size-lg); font-weight: 600; color: var(--color-text-primary); margin: 0; line-height: 1.4; }
.record-date { font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; flex-shrink: 0; padding-top: 2px; }
.record-scores { display: flex; align-items: center; gap: var(--spacing-4); margin-bottom: var(--spacing-3); }
.score-main { display: flex; align-items: baseline; gap: var(--spacing-2); }
.score-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.score-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary); line-height: 1; }
.severity-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: var(--border-radius-full); font-size: var(--font-size-xs); font-weight: 600; line-height: 1.6; }
.subscale-list { display: flex; flex-wrap: wrap; gap: var(--spacing-2); margin-bottom: var(--spacing-3); }
.subscale-tag { display: inline-block; font-size: var(--font-size-xs); padding: 2px 8px; border: 1px solid; border-radius: var(--border-radius-sm); line-height: 1.5; white-space: nowrap; }
.record-actions { display: flex; align-items: center; gap: var(--spacing-2); padding-top: var(--spacing-3); border-top: 1px solid var(--color-border); }
.btn-action { padding: var(--spacing-1) var(--spacing-3); font-size: var(--font-size-xs); }
.btn-ghost { background: transparent; color: var(--color-text-secondary); border: 1px solid transparent; border-radius: var(--border-radius-sm); cursor: pointer; font-family: var(--font-family); font-weight: 500; transition: all var(--transition); }
.btn-ghost:hover { color: var(--color-text-primary); background-color: rgba(0, 0, 0, 0.04); }
.btn-delete:hover { color: var(--color-danger); background-color: rgba(239, 68, 68, 0.06); }
.btn-danger-solid { background-color: var(--color-danger); color: var(--color-text-inverse); border: 1px solid var(--color-danger); border-radius: var(--border-radius-sm); cursor: pointer; font-family: var(--font-family); font-weight: 500; transition: all var(--transition); }
.btn-danger-solid:hover { background-color: #dc2626; border-color: #dc2626; }
.clear-section { max-width: 720px; margin: var(--spacing-8) auto 0; text-align: center; }
.btn-clear { font-size: var(--font-size-sm); color: var(--color-text-secondary); padding: var(--spacing-2) var(--spacing-4); }
.btn-clear:hover { color: var(--color-danger); background-color: rgba(239, 68, 68, 0.06); }
.clear-confirm { background-color: var(--color-surface); border: 1px solid var(--color-danger); border-radius: var(--border-radius); padding: var(--spacing-4) var(--spacing-6); }
.clear-confirm-text { font-size: var(--font-size-sm); color: var(--color-danger); margin-bottom: var(--spacing-3); }
.clear-confirm-buttons { display: flex; justify-content: center; gap: var(--spacing-3); }
@media (max-width: 640px) {
  .history-view { padding: var(--spacing-4) 0 var(--spacing-8); }
  .page-header { padding: var(--spacing-6) 0 var(--spacing-4); }
  .page-title { font-size: var(--font-size-2xl); }
  .record-body { padding: var(--spacing-3) var(--spacing-4); }
  .record-header { flex-direction: column; gap: var(--spacing-1); }
  .record-scores { flex-wrap: wrap; }
  .record-actions { flex-wrap: wrap; }
}
.group-filter { display: flex; flex-wrap: wrap; gap: var(--spacing-2); justify-content: center; margin-bottom: var(--spacing-4); max-width: 720px; margin-left: auto; margin-right: auto; }
.tag-chip { display: inline-flex; align-items: center; padding: 6px 16px; font-family: var(--font-family); font-size: var(--font-size-sm); font-weight: 500; line-height: 1.4; color: var(--color-text-secondary); background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius-full); cursor: pointer; white-space: nowrap; transition: all var(--transition); user-select: none; }
.tag-chip:hover { border-color: var(--color-primary-light); color: var(--color-primary); background-color: rgba(125, 162, 247, 0.04); }
.tag-chip.active { background-color: var(--color-primary); color: var(--color-text-inverse); border-color: var(--color-primary); }
.tag-chip.active:hover { background-color: var(--color-primary-dark); border-color: var(--color-primary-dark); }
@media (max-width: 640px) {
  .group-filter { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: var(--spacing-2); }
  .group-filter::-webkit-scrollbar { display: none; }
}
.chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  background-color: rgba(125, 162, 247, 0.15);
  color: var(--color-primary);
  border-radius: 9px;
  margin-left: 4px;
}
.tag-chip.active .chip-count {
  background-color: rgba(255, 255, 255, 0.25);
  color: var(--color-text-inverse);
}
.tag-chip:focus-visible,
.btn:focus-visible,
.btn-ghost:focus-visible,
.btn-danger-solid:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.data-actions {
  max-width: 720px;
  margin: var(--spacing-6) auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}
.btn-data {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  padding: var(--spacing-2) var(--spacing-4);
}
.data-message {
  width: 100%;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  margin: var(--spacing-2) 0 0;
}
</style>
