<script setup>
import { ref, computed } from 'vue'
import { useLocale } from '@/composables/useLocale'

const props = defineProps({
  tags: {
    type: Array,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
  tagGroups: {
    type: Array,
    default: () => [],
  },
  recommendedTags: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['toggle', 'clear'])
const { t } = useLocale()

const expanded = ref(true)

const groupColors = {
  mood: '#7da2f7',
  self: '#9b8fca',
  social: '#e8a0bf',
  body: '#6bc4a6',
  positive: '#5bb8c9',
}

function getGroupColor(groupId) {
  return groupColors[groupId] || '#7da2f7'
}

const selectedCount = computed(() => props.selectedTags.length)
</script>

<template>
  <div class="tag-filter">
    <!-- Top bar: All + count + expand toggle -->
    <div class="tag-topbar">
      <button
        class="tag-chip tag-chip--all"
        :class="{ active: selectedCount === 0 }"
        @click="emit('clear')"
      >
        {{ t('filter.all') }}
        <span v-if="selectedCount > 0" class="count-badge">{{ selectedCount }}</span>
      </button>

      <!-- Recommended -->
      <template v-if="recommendedTags.length > 0">
        <span class="topbar-divider"></span>
        <span class="rec-label">{{ t('filter.recommended') }}</span>
        <button
          v-for="rid in recommendedTags"
          :key="'rec-' + rid"
          class="tag-chip tag-chip--rec"
          :class="{ active: selectedTags.includes(rid) }"
          @click="emit('toggle', rid)"
        >
          {{ tags.find(t => t.id === rid)?.label || rid }}
        </button>
      </template>

      <button
        v-if="tagGroups.length > 0"
        class="expand-toggle"
        :class="{ 'is-expanded': expanded }"
        @click="expanded = !expanded"
        :aria-label="expanded ? t('a11y.collapse') : t('a11y.expand')"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>

    <!-- Grouped tags (collapsible) -->
    <transition name="groups">
      <div v-if="expanded && tagGroups.length > 0" class="tag-groups">
        <div
          v-for="group in tagGroups"
          :key="group.id"
          class="tag-group"
          :style="{ '--gc': getGroupColor(group.id), '--gc-bg': getGroupColor(group.id) + '10', '--gc-bg-hover': getGroupColor(group.id) + '18' }"
        >
          <div class="group-header">
            <span class="group-dot" :style="{ backgroundColor: getGroupColor(group.id) }"></span>
            <span class="group-label">{{ group.label }}</span>
          </div>
          <div class="tag-row">
            <button
              v-for="tag in group.tags"
              :key="tag.id"
              class="tag-chip tag-chip--grouped"
              :class="{ active: selectedTags.includes(tag.id) }"
              @click="emit('toggle', tag.id)"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Fallback: flat tags -->
    <template v-if="tagGroups.length === 0">
      <div class="tag-row tag-row--flat">
        <button
          v-for="tag in tags"
          :key="tag.id"
          class="tag-chip"
          :class="{ active: selectedTags.includes(tag.id) }"
          @click="emit('toggle', tag.id)"
        >
          {{ tag.label }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tag-filter {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: var(--spacing-2) 0;
}

/* ===== Top bar ===== */
.tag-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-bottom: var(--spacing-3);
}

.topbar-divider {
  width: 1px;
  height: 18px;
  background-color: var(--color-border);
  flex-shrink: 0;
}

.rec-label {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 700;
  white-space: nowrap;
  user-select: none;
  letter-spacing: 0.02em;
}

.expand-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition);
  flex-shrink: 0;
}

.expand-toggle:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.06);
}

.expand-toggle svg {
  transition: transform 0.25s ease;
}

.expand-toggle.is-expanded svg {
  transform: rotate(180deg);
}

/* ===== Groups container ===== */
.tag-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-3);
}

/* collapse / expand transition */
.groups-enter-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.groups-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.groups-enter-from,
.groups-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.groups-enter-to,
.groups-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* ===== Single group ===== */
.tag-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-width: 80px;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: 600;
  white-space: nowrap;
  user-select: none;
  opacity: 0.75;
}

/* ===== Tag row ===== */
.tag-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.tag-row--flat {
  padding-top: var(--spacing-2);
}

/* ===== Chips (base) ===== */
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: 500;
  line-height: 1.5;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  user-select: none;
}

.tag-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(125, 100, 160, 0.08);
}

.tag-chip:active {
  transform: translateY(0);
  box-shadow: none;
}

/* All button */
.tag-chip--all {
  padding: 5px 16px;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.tag-chip--all:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.06);
}

.tag-chip--all.active {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(125, 162, 247, 0.3);
}

.tag-chip--all.active:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.15);
  border-radius: 8px;
}

/* Recommended chips */
.tag-chip--rec {
  border-style: dashed;
  border-color: var(--color-primary);
  color: var(--color-primary-dark, #5a7fd4);
  background-color: rgba(125, 162, 247, 0.08);
  font-weight: 600;
  animation: recPulse 2s ease-in-out 1;
}

.tag-chip--rec:hover {
  border-color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.1);
  color: var(--color-primary-dark);
}

.tag-chip--rec.active {
  border-style: solid;
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(125, 162, 247, 0.3);
  animation: none;
}

@keyframes recPulse {
  0%, 100% { border-color: rgba(125, 162, 247, 0.3); }
  50% { border-color: rgba(125, 162, 247, 0.7); }
}

/* Grouped chips — uses parent's --gc custom property */
.tag-chip--grouped:hover {
  border-color: var(--gc);
  color: var(--gc);
  background-color: var(--gc-bg);
}

.tag-chip--grouped.active {
  background-color: var(--gc);
  color: var(--color-text-inverse);
  border-color: var(--gc);
  font-weight: 600;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--gc) 35%, transparent);
}

.tag-chip--grouped.active:hover {
  filter: brightness(0.92);
}

/* ===== Mobile ===== */
@media (max-width: 640px) {
  .tag-topbar {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: var(--spacing-2);
  }

  .tag-topbar::-webkit-scrollbar {
    display: none;
  }

  .expand-toggle {
    position: sticky;
    right: 0;
    background: var(--color-surface);
    box-shadow: -8px 0 8px var(--color-surface);
  }

  .tag-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .group-header {
    min-width: auto;
  }

  .tag-row {
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    width: 100%;
    padding-bottom: 2px;
  }

  .tag-row::-webkit-scrollbar {
    display: none;
  }

  /* slightly bigger tap targets on mobile */
  .tag-chip {
    padding: 6px 14px;
    min-height: 32px;
  }

  .tag-chip--all {
    padding: 6px 16px;
    min-height: 32px;
  }
}
/* Focus indicators */
.tag-chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.expand-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .tag-chip,
  .expand-toggle,
  .expand-toggle svg,
  .groups-enter-active,
  .groups-leave-active {
    transition: none !important;
    animation: none !important;
  }
}
</style>
