<script setup>
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useLocalizedRouter } from '@/composables/useLocalizedRouter'
import BreadcrumbNav from '@/components/common/BreadcrumbNav.vue'
const { t } = useLocale()
const { currentLang } = useLocalizedRouter()
const homeTo = computed(() => ({ name: 'home', params: currentLang.value ? { lang: currentLang.value } : {} }))
</script>

<template>
  <div class="not-found-view">
    <BreadcrumbNav :items="[{ label: t('nav.home'), to: { name: 'home' } }, { label: '404' }]" />
    <div class="not-found-content">
      <h1 class="not-found-code">404</h1>
      <p class="not-found-message">{{ t('notFound.message') }}</p>
      <router-link :to="homeTo" class="not-found-link">{{ t('notFound.backHome') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-4);
}
.not-found-content {
  text-align: center;
  padding: var(--spacing-16) var(--spacing-4);
}
.not-found-code {
  font-size: 6rem;
  font-weight: 800;
  color: var(--color-text-tertiary);
  margin: 0;
  line-height: 1;
}
.not-found-message {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: var(--spacing-4) 0 var(--spacing-8);
}
.not-found-link {
  display: inline-block;
  padding: var(--spacing-3) var(--spacing-6);
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 600;
}
.not-found-link:hover {
  opacity: 0.9;
}
</style>
