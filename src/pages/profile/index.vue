<template>
  <view :class="['page-profile', resolvedTheme === 'dark' ? 'dark' : '']">
    <view class="profile-header">
      <text class="profile-title">{{ t('profile.title') }}</text>
    </view>

    <view class="settings-section">
      <!-- Language -->
      <view class="setting-item card" @tap="toggleLocale">
        <view class="setting-left">
          <text class="setting-icon">&#x1F310;</text>
          <text class="setting-label">{{ t('profile.language') }}</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ locale === 'zh' ? '中文' : 'English' }}</text>
          <text class="setting-arrow">&#x203A;</text>
        </view>
      </view>

      <!-- Theme -->
      <view class="setting-item card" @tap="cycleTheme">
        <view class="setting-left">
          <text class="setting-icon">{{ themeIcon }}</text>
          <text class="setting-label">{{ t('profile.theme') }}</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ themeLabel }}</text>
          <text class="setting-arrow">&#x203A;</text>
        </view>
      </view>
    </view>

    <!-- Queue section -->
    <view v-if="queue.length > 0" class="queue-section">
      <text class="section-title">{{ t('queue.title') }} ({{ queue.length }})</text>
      <view class="queue-list card">
        <view v-for="item in queue" :key="item.id" class="queue-item">
          <view class="queue-info">
            <text class="queue-name">{{ item.name }}</text>
            <text class="queue-meta">{{ t('card.minutes', { count: item.estimatedMinutes || 5 }) }}</text>
          </view>
          <view class="queue-actions">
            <text class="queue-start" @tap="startQueue(item)">{{ t('queue.start') }}</text>
            <text class="queue-remove" @tap="removeFromQueue(item.id)">{{ t('queue.remove') }}</text>
          </view>
        </view>
      </view>
      <button class="btn btn-outline btn-block mt-md" @tap="clearQueue">{{ t('queue.clear') }}</button>
    </view>

    <!-- About section -->
    <view class="about-section">
      <text class="section-title">{{ t('profile.about') }}</text>
      <view class="card about-card">
        <view class="about-row">
          <text class="about-label">{{ t('profile.version') }}</text>
          <text class="about-value">1.0.0</text>
        </view>
        <view class="about-row">
          <text class="about-label">MindQuest</text>
          <text class="about-value">心灵探索</text>
        </view>
      </view>
    </view>

    <!-- Disclaimer -->
    <view class="disclaimer-section">
      <text class="section-title">{{ t('profile.disclaimer') }}</text>
      <view class="card disclaimer-card">
        <text class="disclaimer-text">{{ t('profile.disclaimerText') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'
import { useQueue } from '../../composables/useQueue'

const { locale, t, toggleLocale } = useLocale()
const { theme, resolvedTheme, cycleTheme } = useTheme()
const { queue, removeFromQueue, clearQueue } = useQueue()

const themeIcon = computed(() => {
  if (theme.value === 'dark') return '\u{1F319}'
  if (theme.value === 'light') return '\u2600\uFE0F'
  return '\u{1F5A5}\uFE0F'
})

const themeLabel = computed(() => {
  return t(`theme.${theme.value}`)
})

function startQueue(item) {
  uni.navigateTo({
    url: `/pages/assessment/index?id=${item.id}`
  })
}

function updateProfileMeta() {
  // #ifdef H5
  document.title = t('nav.profile') + ' - MindQuest'

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = 'MindQuest settings and preferences'

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${window.location.origin}/profile`

  // Profile is personal - don't index
  let robotsMeta = document.querySelector('meta[name="robots"]')
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta')
    robotsMeta.name = 'robots'
    document.head.appendChild(robotsMeta)
  }
  robotsMeta.content = 'noindex, nofollow'

  // OG tags
  const ogUpdates = {
    'og:title': t('nav.profile') + ' - MindQuest',
    'og:description': 'MindQuest settings and preferences',
    'og:url': `${window.location.origin}/profile`,
  }
  for (const [prop, content] of Object.entries(ogUpdates)) {
    let tag = document.querySelector(`meta[property="${prop}"]`)
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('property', prop)
      document.head.appendChild(tag)
    }
    tag.content = content
  }
  // #endif
}

onShow(() => {
  updateProfileMeta()
})
</script>

<style scoped>
.page-profile {
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 30rpx;
}

.profile-header {
  margin-bottom: 40rpx;
}

.profile-title {
  font-size: var(--font-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 40rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.setting-icon {
  font-size: 36rpx;
}

.setting-label {
  font-size: var(--font-base);
  color: var(--color-text-primary);
}

.setting-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.setting-value {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.setting-arrow {
  font-size: 32rpx;
  color: var(--color-text-tertiary);
}

.section-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16rpx;
  display: block;
}

.queue-section {
  margin-bottom: 40rpx;
}

.queue-list {
  padding: 0;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid var(--color-border);
}

.queue-item:last-child {
  border-bottom: none;
}

.queue-info {
  flex: 1;
}

.queue-name {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  display: block;
}

.queue-meta {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}

.queue-actions {
  display: flex;
  gap: 16rpx;
}

.queue-start {
  font-size: var(--font-sm);
  color: var(--color-primary);
  font-weight: 500;
}

.queue-remove {
  font-size: var(--font-sm);
  color: var(--color-danger);
}

.about-section {
  margin-bottom: 40rpx;
}

.about-card {
  padding: 24rpx;
}

.about-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.about-label {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.about-value {
  font-size: var(--font-base);
  color: var(--color-text-primary);
}

.disclaimer-section {
  margin-bottom: 60rpx;
}

.disclaimer-card {
  padding: 24rpx;
}

.disclaimer-text {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
}
</style>
