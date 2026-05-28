<template>
  <view :class="['page-history', resolvedTheme === 'dark' ? 'dark' : '']">
    <!-- Header actions -->
    <view v-if="records.length > 0" class="history-actions">
      <text class="text-secondary text-sm">{{ records.length }} {{ t('history.recordCount') }}</text>
      <text class="action-clear" @tap="confirmClearAll">{{ t('history.clearAll') }}</text>
    </view>

    <!-- Records list -->
    <scroll-view class="history-list" scroll-y :style="{ height: listHeight + 'px' }">
      <view v-if="loading" class="loading-state">
        <view v-for="i in 3" :key="i" class="skeleton-card">
          <view class="skeleton" style="height: 36rpx; width: 50%;"></view>
          <view class="skeleton" style="height: 28rpx; width: 70%; margin-top: 12rpx;"></view>
        </view>
      </view>

      <view v-else-if="records.length === 0" class="empty-state">
        <text class="empty-icon">&#x1F4CB;</text>
        <text class="empty-text">{{ t('history.empty') }}</text>
        <text class="empty-hint text-secondary text-sm">{{ t('history.emptyHint') }}</text>
        <button class="btn btn-primary mt-lg" @tap="goHome">{{ t('history.startAssessment') }}</button>
      </view>

      <view v-else class="record-cards">
        <view
          v-for="record in records"
          :key="record.key"
          class="record-card card"
          @tap="viewReport(record)"
        >
          <view class="record-header">
            <text class="record-name">{{ record.data.scaleName }}</text>
            <view class="record-score" :style="{ color: getScoreColor(record.data.report) }">
              <text class="score-value">{{ record.data.scores.total }}</text>
              <text class="score-suffix">{{ t('history.scoreSuffix') }}</text>
            </view>
          </view>
          <view class="record-meta">
            <text class="record-date">{{ formatDate(record.data.timestamp) }}</text>
            <text v-if="record.data.report" class="record-level" :style="{ color: getScoreColor(record.data.report) }">
              {{ record.data.report.label }}
            </text>
          </view>
          <!-- Swipe delete -->
          <view class="record-actions">
            <text class="action-delete" @tap.stop="confirmDelete(record)">{{ t('history.delete') }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useHistory } from '../../composables/useHistory'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'
import { getSeverityColor } from '../../engine/reportEngine'

const { records, loading, loadRecords, removeRecord, clearAll, formatDate } = useHistory()
const { t } = useLocale()
const { resolvedTheme } = useTheme()
const listHeight = ref(600)

function getScoreColor(report) {
  if (!report || !report.level) return 'var(--color-text-primary)'
  return getSeverityColor(report.level)
}

function viewReport(record) {
  uni.navigateTo({
    url: `/pages/report/index?key=${encodeURIComponent(record.key)}`
  })
}

function confirmDelete(record) {
  uni.showModal({
    title: t('history.confirmDelete'),
    confirmColor: '#ef4444',
    success(res) {
      if (res.confirm) {
        removeRecord(record.key)
      }
    }
  })
}

function confirmClearAll() {
  uni.showModal({
    title: t('history.clearAll'),
    content: t('history.clearConfirm'),
    confirmColor: '#ef4444',
    success(res) {
      if (res.confirm) {
        clearAll()
      }
    }
  })
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

function updateHistoryMeta() {
  // #ifdef H5
  document.title = t('nav.history') + ' - MindQuest'

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = 'View your psychological assessment history - MindQuest'

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${window.location.origin}/history`
  // #endif
}

onShow(() => {
  loadRecords()
  updateHistoryMeta()
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  listHeight.value = sysInfo.windowHeight - 140
})
</script>

<style scoped>
.page-history {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
}

.history-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
}

.action-clear {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.history-list {
  flex: 1;
  padding: 0 30rpx;
}

.record-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 30rpx;
}

.record-card {
  padding: 24rpx;
  position: relative;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.record-name {
  font-size: var(--font-md);
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
  margin-right: 16rpx;
}

.record-score {
  display: flex;
  align-items: baseline;
  flex-shrink: 0;
}

.score-value {
  font-size: var(--font-xl);
  font-weight: 700;
}

.score-suffix {
  font-size: var(--font-xs);
  margin-left: 4rpx;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.record-date {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}

.record-level {
  font-size: var(--font-sm);
  font-weight: 500;
}

.record-actions {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
}

.action-delete {
  font-size: var(--font-xs);
  color: var(--color-danger);
  padding: 8rpx 16rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: var(--font-lg);
  color: var(--color-text-primary);
  font-weight: 500;
}

.empty-hint {
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 20rpx 0;
}

.skeleton-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24rpx;
}
</style>
