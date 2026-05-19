<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useLocale } from '@/composables/useLocale'

const route = useRoute()
const { t, toggleLocale, locale } = useLocale()

const emit = defineEmits(['toggle-sidebar'])
</script>

<template>
  <header class="app-header">
    <div class="header-inner container">
      <div class="header-left">
        <button
          class="hamburger-btn"
          @click="emit('toggle-sidebar')"
          v-if="route.name !== 'assessment'"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <RouterLink to="/" class="header-logo">
          <svg class="logo-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7.5L12 20l-3-3.5C7 14.5 5 12 5 9a7 7 0 0 1 7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span class="logo-text">MindQuest</span>
        </RouterLink>
      </div>
      <nav class="header-nav">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link-active">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>{{ t('nav.home') }}</span>
        </RouterLink>
        <RouterLink to="/history" class="nav-link" active-class="nav-link-active">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{{ t('nav.history') }}</span>
        </RouterLink>
        <button
          v-if="route.name !== 'assessment'"
          class="lang-toggle-btn"
          @click="toggleLocale()"
        >
          {{ locale === 'zh' ? 'EN' : '中文' }}
        </button>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(232, 160, 191, 0.2);
  backdrop-filter: blur(8px);
  background-color: rgba(250, 248, 252, 0.92);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all var(--transition);
}

.hamburger-btn:hover {
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.06);
}

@media (max-width: 767px) {
  .hamburger-btn {
    display: flex;
  }
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: var(--font-size-xl);
  text-decoration: none;
  transition: color var(--transition);
}

.header-logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  color: var(--color-secondary);
}

.logo-text {
  letter-spacing: -0.02em;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition);
}

.nav-link:hover {
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.06);
}

.nav-link-active {
  color: var(--color-primary);
  background-color: rgba(125, 162, 247, 0.08);
}

.nav-icon {
  flex-shrink: 0;
}

.lang-toggle-btn {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  font-family: var(--font-family);
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}

.lang-toggle-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
  background-color: rgba(125, 162, 247, 0.04);
}
</style>
