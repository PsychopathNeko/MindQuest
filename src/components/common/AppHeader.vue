<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <div class="header-inner container">
      <RouterLink to="/" class="header-logo">
        <svg class="logo-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7.5L12 20l-3-3.5C7 14.5 5 12 5 9a7 7 0 0 1 7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <span class="logo-text">MindQuest</span>
      </RouterLink>
      <nav class="header-nav">
        <RouterLink to="/history" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>历史记录</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.9);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: var(--font-size-lg);
  text-decoration: none;
  transition: color var(--transition);
}

.header-logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  color: var(--color-primary);
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
  background-color: rgba(59, 130, 246, 0.06);
}

.nav-icon {
  flex-shrink: 0;
}
</style>
