<script setup>
import { ref, computed, onMounted, onUnmounted, onServerPrefetch, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useTagFilter } from '@/composables/useTagFilter'
import { useLocale } from '@/composables/useLocale'
import { useQueue } from '@/composables/useQueue'
import { useLocalizedRouter } from '@/composables/useLocalizedRouter'
import { useHead } from '@unhead/vue'
import TagFilter from '@/components/common/TagFilter.vue'
import ScaleCard from '@/components/common/ScaleCard.vue'

const router = useRouter()
const { push: localizedPush } = useLocalizedRouter()
const { scales, tags, tagGroups, loading, error, loadIndex } = useScaleLoader()
const { selectedTags, filteredScales, recommendedTags, toggleTag, clearTags } = useTagFilter(scales)
const { t, locale } = useLocale()
const { addToQueue, isInQueue, updateQueueNames } = useQueue()

const siteOrigin = import.meta.env.BASE_URL === '/MindQuest/'
  ? 'https://psychopathneko.github.io/MindQuest'
  : 'https://mindquest-neko.vercel.app'

useHead({
  title: computed(() => t('meta.title')),
  meta: [
    { name: 'description', content: computed(() => t('meta.description')) },
    { property: 'og:title', content: computed(() => t('meta.title')) },
    { property: 'og:description', content: computed(() => t('meta.description')) },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'MindQuest',
        'url': siteOrigin + '/',
        'description': t('meta.description'),
        'potentialAction': {
          '@type': 'SearchAction',
          'target': siteOrigin + '/?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }))
    }
  ],
})

const rawQuery = ref('')
const debouncedQuery = ref('')
let debounceTimer = null
const searchFocused = ref(false)
const searchRef = ref(null)
const highlightedIndex = ref(-1)

watch(rawQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = val
  }, 200)
})

const PAGE_SIZE = 18
const currentPage = ref(1)

const searchResults = computed(() => {
  const q = debouncedQuery.value.trim().toLowerCase()
  if (!q || !scales.value) return []
  return scales.value.filter((s) => {
    const name = (s.name || '').toLowerCase()
    const short = (s.shortName || '').toLowerCase()
    const desc = (s.description || '').toLowerCase()
    return name.includes(q) || short.includes(q) || desc.includes(q)
  }).slice(0, 8)
})

watch(searchResults, () => {
  highlightedIndex.value = -1
})

const showDropdown = computed(() => searchFocused.value && debouncedQuery.value.trim().length > 0)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredScales.value.length / PAGE_SIZE)))
const visibleScales = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredScales.value.slice(start, start + PAGE_SIZE)
})

function goPage(page) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

function startScale(scaleId) {
  rawQuery.value = ''
  debouncedQuery.value = ''
  searchFocused.value = false
  localizedPush({ name: 'scale-detail', params: { id: scaleId } })
}

function addScale(scale) {
  addToQueue({ id: scale.id, name: scale.name, shortName: scale.shortName, estimatedMinutes: scale.estimatedMinutes })
}

function handleSearchKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (searchResults.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % searchResults.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (searchResults.value.length > 0) {
      highlightedIndex.value = highlightedIndex.value <= 0
        ? searchResults.value.length - 1
        : highlightedIndex.value - 1
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightedIndex.value >= 0 && highlightedIndex.value < searchResults.value.length) {
      startScale(searchResults.value[highlightedIndex.value].id)
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    searchFocused.value = false
    rawQuery.value = ''
    debouncedQuery.value = ''
  }
}

function handleClickOutside(e) {
  if (searchRef.value && !searchRef.value.contains(e.target)) {
    searchFocused.value = false
  }
}

onServerPrefetch(async () => {
  await loadIndex()
})

onMounted(() => {
  if (!scales.value.length) loadIndex()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
  document.removeEventListener('click', handleClickOutside)
})

watch([selectedTags, filteredScales], () => {
  currentPage.value = 1
})

watch(locale, async () => {
  await loadIndex()
  updateQueueNames(scales.value)
})
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">{{ t('home.title') }}</h1>
        <p class="hero-subtitle">
          {{ t('home.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="container main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('home.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ t('home.loadError') }}: {{ error }}</p>
        <button class="btn btn-primary" @click="loadIndex()">{{ t('home.retry') }}</button>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Search Bar -->
        <div ref="searchRef" class="search-wrapper">
          <div class="search-bar" :class="{ focused: searchFocused }">
            <svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="rawQuery"
              type="text"
              class="search-input"
              :placeholder="t('search.placeholder')"
              @focus="searchFocused = true"
              @keydown="handleSearchKeydown"
              :aria-activedescendant="showDropdown && highlightedIndex >= 0 ? 'search-option-' + highlightedIndex : undefined"
            />
            <button v-if="rawQuery" class="search-clear" @click="rawQuery = ''; debouncedQuery = ''" :aria-label="t('a11y.clearSearch')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Search Dropdown -->
          <transition name="dropdown">
            <div v-if="showDropdown" class="search-dropdown" role="listbox">
              <div v-if="searchResults.length === 0" class="search-empty">
                {{ t('search.noResult') }}
              </div>
              <div
                v-for="(s, idx) in searchResults"
                :key="s.id"
                :id="'search-option-' + idx"
                class="search-item"
                :class="{ highlighted: idx === highlightedIndex }"
                role="option"
                :aria-selected="idx === highlightedIndex"
              >
                <div class="search-item-info" @click="startScale(s.id)">
                  <span class="search-item-badge">{{ s.shortName }}</span>
                  <span class="search-item-name">{{ s.name }}</span>
                  <span class="search-item-meta">{{ t('card.questions', { count: s.questionCount }) }}</span>
                </div>
                <div class="search-item-actions">
                  <button class="search-btn search-btn--start" @click="startScale(s.id)">{{ t('search.start') }}</button>
                  <button
                    class="search-btn search-btn--queue"
                    :class="{ 'is-added': isInQueue(s.id) }"
                    :disabled="isInQueue(s.id)"
                    @click="addScale(s)"
                  >
                    {{ isInQueue(s.id) ? t('search.added') : t('search.addQueue') }}
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Tag Filter -->
        <TagFilter
          v-if="tags.length > 0"
          :tags="tags"
          :tag-groups="tagGroups"
          :recommended-tags="recommendedTags"
          :selected-tags="selectedTags"
          @toggle="toggleTag"
          @clear="clearTags"
        />

        <!-- Count -->
        <p class="scale-count">
          {{ t('home.scaleCount', { count: filteredScales.length }) }}
        </p>

        <!-- Scale Grid -->
        <div class="scale-grid">
          <ScaleCard
            v-for="scale in visibleScales"
            :key="scale.id"
            :scale="scale"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination" role="navigation" aria-label="pagination">
          <button class="page-btn" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)" :aria-label="t('home.prevPage')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            {{ t('home.prevPage') }}
          </button>
          <span class="page-info">{{ t('home.pageInfo', { current: currentPage, total: totalPages }) }}</span>
          <button class="page-btn" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)" :aria-label="t('home.nextPage')">
            {{ t('home.nextPage') }}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="filteredScales.length === 0 && scales.length > 0" class="empty-state">
          <p>{{ t('home.noMatch') }}</p>
          <button class="btn btn-outline" @click="clearTags">{{ t('home.clearFilter') }}</button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.hero { text-align: center; padding: var(--spacing-12) 0 var(--spacing-8); background: linear-gradient(180deg, rgba(125,162,247,0.06) 0%, rgba(232,160,191,0.04) 100%); }
.hero-title { font-size: var(--font-size-4xl); font-weight: 700; color: var(--color-text-primary); letter-spacing: -0.03em; margin-bottom: var(--spacing-3); }
.hero-subtitle { font-size: var(--font-size-lg); color: var(--color-text-secondary); max-width: 480px; margin: 0 auto; line-height: 1.6; font-weight: 400; letter-spacing: 0.02em; }
@media (max-width: 640px) {
  .hero { padding: var(--spacing-6) 0 var(--spacing-4); }
  .hero-title { font-size: var(--font-size-2xl); }
  .hero-subtitle { font-size: var(--font-size-sm); padding: 0 var(--spacing-2); }
}
@media (max-width: 374px) {
  .hero-title { font-size: var(--font-size-xl); }
}
.main-content { padding-bottom: var(--spacing-12); }

/* ===== Search ===== */
.search-wrapper {
  position: relative;
  margin-bottom: var(--spacing-2);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  transition: all var(--transition);
}

.search-bar.focused {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 3px rgba(125, 162, 247, 0.1);
}

.search-icon {
  color: var(--color-text-secondary);
  flex-shrink: 0;
  opacity: 0.6;
}

.search-bar.focused .search-icon {
  color: var(--color-primary);
  opacity: 1;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition);
}

.search-clear:hover {
  background-color: rgba(0, 0, 0, 0.06);
  color: var(--color-text-primary);
}

/* ===== Dropdown ===== */
.search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 500;
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-enter-active { transition: all 0.2s ease; }
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

.search-empty {
  padding: var(--spacing-6) var(--spacing-4);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color var(--transition);
}

.search-item:last-child {
  border-bottom: none;
}

.search-item:hover {
  background-color: rgba(125, 162, 247, 0.04);
}

.search-item.highlighted {
  background-color: rgba(125, 162, 247, 0.08);
}

.search-item.highlighted .search-item-name {
  color: var(--color-primary);
}

.search-item-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.search-item-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-secondary);
  background-color: rgba(232, 160, 191, 0.12);
  border-radius: var(--border-radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

.search-item-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-item-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
  opacity: 0.7;
}

.search-item-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.search-btn {
  padding: 3px 10px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 1px solid;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition);
}

.search-btn--start {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.search-btn--start:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.search-btn--queue {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.search-btn--queue:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
}

.search-btn--queue.is-added {
  color: var(--color-success-text);
  border-color: var(--color-success-border);
  background-color: var(--color-success-light);
  cursor: default;
}

/* ===== Rest ===== */
.scale-count { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: var(--spacing-4) 0; }
.scale-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-4); }
@media (min-width: 640px) { .scale-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .scale-grid { grid-template-columns: repeat(3, 1fr); } }
.error-state { text-align: center; padding: var(--spacing-12) 0; color: var(--color-danger); }
.error-state .btn { margin-top: var(--spacing-4); }
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--spacing-4); padding: var(--spacing-8) 0 var(--spacing-4); }
.page-btn { display: inline-flex; align-items: center; gap: 4px; padding: var(--spacing-2) var(--spacing-4); font-family: var(--font-family); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); background-color: var(--color-surface); border: 1px solid var(--color-primary-light); border-radius: var(--border-radius-sm); cursor: pointer; transition: all var(--transition); user-select: none; }
.page-btn:hover:not(:disabled) { background-color: rgba(125, 162, 247, 0.08); border-color: var(--color-primary); box-shadow: 0 2px 8px rgba(125, 162, 247, 0.15); }
.page-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
.page-btn:disabled { color: var(--color-text-secondary); border-color: var(--color-border); opacity: 0.4; cursor: not-allowed; }
.page-btn svg { flex-shrink: 0; }
.page-info { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-secondary); user-select: none; min-width: 48px; text-align: center; }
.empty-state { text-align: center; padding: var(--spacing-12) 0; color: var(--color-text-secondary); }
.empty-state .btn { margin-top: var(--spacing-4); }

/* ===== Mobile search ===== */
@media (max-width: 640px) {
  .search-bar {
    padding: var(--spacing-2) var(--spacing-3);
  }

  .search-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }

  .search-item-actions {
    width: 100%;
  }

  .search-btn {
    flex: 1;
    text-align: center;
    padding: 6px 10px;
    min-height: 32px;
  }
}

/* Focus indicators */
.search-input:focus-visible {
  outline: none;
}
.search-btn:focus-visible,
.page-btn:focus-visible,
.search-clear:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
