<template>
  <view :class="['page-home', resolvedTheme === 'dark' ? 'dark' : '']">
    <!-- Search bar -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">&#x1F50D;</text>
        <input
          class="search-input"
          type="text"
          :placeholder="t('search.placeholder')"
          :value="searchQuery"
          @input="onSearchInput"
          confirm-type="search"
        />
        <text v-if="searchQuery" class="search-clear" @tap="clearSearch">✕</text>
      </view>
    </view>

    <!-- Tag filter -->
    <scroll-view class="tag-scroll" scroll-x enable-flex>
      <view class="tag-list">
        <text
          :class="['tag', selectedTags.length === 0 ? 'tag-active' : '']"
          @tap="clearTags"
        >{{ t('filter.all') }}</text>
        <text
          v-for="tag in displayTags"
          :key="tag.id"
          :class="['tag', selectedTags.includes(tag.id) ? 'tag-active' : '']"
          @tap="toggleTag(tag.id)"
        >{{ tag.label }}</text>
      </view>
    </scroll-view>

    <!-- Scale count -->
    <view class="scale-count">
      <text class="text-secondary text-sm">{{ t('home.scaleCount', { count: displayScales.length }) }}</text>
    </view>

    <!-- Scale list -->
    <scroll-view
      class="scale-list"
      scroll-y
      :style="{ height: listHeight + 'px' }"
      @scrolltolower="loadMore"
    >
      <view v-if="loading" class="loading-state">
        <view v-for="i in 4" :key="i" class="skeleton-card">
          <view class="skeleton" style="height: 40rpx; width: 60%;"></view>
          <view class="skeleton" style="height: 28rpx; width: 90%; margin-top: 16rpx;"></view>
          <view class="skeleton" style="height: 28rpx; width: 40%; margin-top: 12rpx;"></view>
        </view>
      </view>

      <view v-else-if="displayScales.length === 0" class="empty-state">
        <text class="empty-text">{{ t('home.noMatch') }}</text>
        <button class="btn btn-outline" @tap="resetFilters">{{ t('home.clearFilter') }}</button>
      </view>

      <view v-else class="scale-cards">
        <view
          v-for="scale in pagedScales"
          :key="scale.id"
          class="scale-card card"
          @tap="goToScale(scale.id)"
        >
          <view class="card-header">
            <text class="card-title">{{ scale.name }}</text>
            <text class="card-short">{{ scale.shortName }}</text>
          </view>
          <text class="card-desc">{{ scale.description }}</text>
          <view class="card-footer">
            <view class="card-meta">
              <text class="meta-item">{{ t('card.questions', { count: scale.questionCount || '?' }) }}</text>
              <text class="meta-item">{{ t('card.minutes', { count: scale.estimatedMinutes || '?' }) }}</text>
            </view>
            <view class="card-tags">
              <text v-for="tag in (scale.resolvedTags || []).slice(0, 2)" :key="tag.id" class="card-tag">{{ tag.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Load more indicator -->
      <view v-if="hasMore" class="load-more">
        <text class="text-secondary text-sm">{{ t('home.loadMore') }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useScaleLoader } from '../../composables/useScaleLoader'
import { useTagFilter } from '../../composables/useTagFilter'
import { useLocale } from '../../composables/useLocale'
import { useTheme } from '../../composables/useTheme'

const { scales, tags, loading, loadIndex } = useScaleLoader()
const { selectedTags, filteredScales, toggleTag, clearTags } = useTagFilter(scales)
const { t } = useLocale()
const { resolvedTheme } = useTheme()

const searchQuery = ref('')
const pageSize = 20
const currentPage = ref(1)
const listHeight = ref(500)

const displayTags = computed(() => {
  return (tags.value || []).slice(0, 20)
})

const displayScales = computed(() => {
  let result = filteredScales.value
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.shortName && s.shortName.toLowerCase().includes(query)) ||
      (s.description && s.description.toLowerCase().includes(query))
    )
  }
  return result
})

const pagedScales = computed(() => {
  return displayScales.value.slice(0, currentPage.value * pageSize)
})

const hasMore = computed(() => {
  return pagedScales.value.length < displayScales.value.length
})

function loadMore() {
  if (hasMore.value) {
    currentPage.value++
  }
}

function onSearchInput(e) {
  searchQuery.value = e.detail.value
  currentPage.value = 1
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  clearTags()
  currentPage.value = 1
}

function goToScale(id) {
  uni.navigateTo({ url: `/pages/scale-detail/index?id=${id}` })
}

function updateHomeMeta() {
  // #ifdef H5
  document.title = t('app.title') || 'MindQuest - Psychological Self-Assessment'

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) {
    metaDesc = document.createElement('meta')
    metaDesc.name = 'description'
    document.head.appendChild(metaDesc)
  }
  metaDesc.content = t('app.description') || 'Professional psychological self-assessment platform with 158 validated scales'

  // Set canonical for home
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = window.location.origin + '/'

  // Add hreflang for home
  const hreflangs = [
    { lang: 'zh-CN', href: `${window.location.origin}/?lang=zh` },
    { lang: 'en', href: `${window.location.origin}/?lang=en` },
    { lang: 'x-default', href: `${window.location.origin}/` },
  ]
  hreflangs.forEach(({ lang, href }) => {
    let link = document.querySelector(`link[hreflang="${lang}"]`)
    if (!link) {
      link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = lang
      document.head.appendChild(link)
    }
    link.href = href
  })
  // #endif
}

onShow(() => {
  updateHomeMeta()
  loadIndex()
  // #ifdef H5
  if (!document.getElementById('site-jsonld')) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'site-jsonld'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MindQuest',
      alternateName: '心灵探索',
      url: window.location.origin,
      description: 'Free online psychological self-assessment platform with 100+ validated scales.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: window.location.origin + '/pages/home/index?q={search_term_string}' },
        'query-input': 'required name=search_term_string'
      }
    })
    document.head.appendChild(script)
  }
  // #endif
})

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  listHeight.value = sysInfo.windowHeight - 270
})
</script>

<style scoped>
.page-home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-bg);
}

.search-bar {
  padding: 20rpx 30rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 16rpx 24rpx;
  box-shadow: var(--shadow-sm);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: var(--font-base);
  color: var(--color-text-primary);
}

.search-clear {
  color: var(--color-text-tertiary);
  padding: 8rpx;
  font-size: 28rpx;
}

.tag-scroll {
  white-space: nowrap;
  padding: 0 30rpx 16rpx;
}

.tag-list {
  display: flex;
  gap: 16rpx;
}

.scale-count {
  padding: 0 30rpx 12rpx;
}

.scale-list {
  flex: 1;
  padding: 0 30rpx;
}

.scale-cards {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 30rpx;
}

.scale-card {
  padding: 28rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.card-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-short {
  font-size: var(--font-xs);
  color: var(--color-primary);
  background-color: var(--color-primary-bg);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.card-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.card-meta {
  display: flex;
  gap: 16rpx;
}

.meta-item {
  font-size: var(--font-xs);
  color: var(--color-text-tertiary);
}

.card-tags {
  display: flex;
  gap: 8rpx;
}

.card-tag {
  font-size: 20rpx;
  color: var(--color-text-secondary);
  background-color: var(--color-surface-alt);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  gap: 24rpx;
}

.empty-text {
  color: var(--color-text-secondary);
  font-size: var(--font-base);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 24rpx 0 40rpx;
}
</style>
