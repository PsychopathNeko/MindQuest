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
</style>
