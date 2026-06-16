<script setup>
import { useLocale } from '@/composables/useLocale'
import { useHead } from '@unhead/vue'
import { computed } from 'vue'

const { t } = useLocale()

useHead({
  title: computed(() => t('about.metaTitle')),
  meta: [
    { name: 'description', content: computed(() => t('about.metaDescription')) },
  ],
})
</script>

<template>
  <div class="about-view">
    <article class="about-content">
      <p class="about-date">{{ t('about.date') }}</p>
      <p>{{ t('about.p1') }}</p>
      <p>{{ t('about.p2') }}</p>
      <p>{{ t('about.p3') }}</p>
      <p>{{ t('about.p4') }}</p>
      <p class="about-signature">— nekoy</p>
    </article>
  </div>
</template>

<style scoped>
.about-view {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: linear-gradient(180deg, rgba(125, 162, 247, 0.06) 0%, rgba(232, 160, 191, 0.04) 100%);
}

.about-content {
  max-width: 620px;
  width: 100%;
}

.about-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-6);
  letter-spacing: 0.05em;
}

.about-content p {
  font-size: var(--font-size-base);
  line-height: 2;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-5);
  letter-spacing: 0.02em;
}

.about-signature {
  text-align: right;
  font-style: italic;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-8);
  margin-bottom: 0;
  font-size: var(--font-size-sm);
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .about-view {
    min-height: calc(100vh - 48px);
    padding: 2rem 1.25rem;
  }

  .about-content {
    max-width: 100%;
  }

  .about-content p {
    font-size: var(--font-size-sm);
  }
}
</style>
