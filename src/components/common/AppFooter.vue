<script setup>
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner container">
      <p class="footer-disclaimer">
        {{ t('footer.disclaimer') }}
      </p>
      <p class="footer-copyright">
        &copy; {{ new Date().getFullYear() }} MindQuest
      </p>
      <a
        href="https://cloud.umami.is/share/7xR84re9wujOCkSu"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-analytics"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
        {{ t('footer.analytics') }}
      </a>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid rgba(232, 160, 191, 0.2);
  background-color: var(--color-background);
  padding: var(--spacing-6) 0;
  margin-top: var(--spacing-12);
}

.footer-inner {
  text-align: center;
}

.footer-disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto var(--spacing-2);
}

.footer-copyright {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.footer-analytics {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  opacity: 0.4;
  text-decoration: none;
  margin-top: var(--spacing-2);
  transition: opacity 0.2s;
}

.footer-analytics:hover {
  opacity: 0.7;
}
</style>
