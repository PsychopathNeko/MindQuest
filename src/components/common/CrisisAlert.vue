<script setup>
import { useLocale } from '@/composables/useLocale'
const { t } = useLocale()
</script>

<template>
  <div class="crisis-alert" role="alert">
    <div class="crisis-header">
      <div class="crisis-icon-wrap">
        <svg class="crisis-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="crisis-title">{{ t('crisis.title') }}</h3>
    </div>
    <p class="crisis-description">{{ t('crisis.description') }}</p>
    <div class="crisis-hotlines">
      <p class="crisis-hotlines-title">{{ t('crisis.hotlineTitle') }}</p>
      <ul class="crisis-hotline-list">
        <li><strong>{{ t('crisis.line1Label') }}</strong> <a :href="'tel:' + t('crisis.line1Number')" class="crisis-tel">{{ t('crisis.line1Number') }}</a></li>
        <li><strong>{{ t('crisis.line2Label') }}</strong> <a :href="'tel:' + t('crisis.line2Number')" class="crisis-tel">{{ t('crisis.line2Number') }}</a></li>
        <li><strong>{{ t('crisis.line3Label') }}</strong> <a :href="'tel:' + t('crisis.line3Number')" class="crisis-tel">{{ t('crisis.line3Number') }}</a></li>
        <li><strong>{{ t('crisis.line4Label') }}</strong> <a :href="'sms:' + t('crisis.line4Number')" class="crisis-tel">{{ t('crisis.line4Display') || t('crisis.line4Number') }}</a></li>
      </ul>
    </div>
    <p class="crisis-action">{{ t('crisis.action') }}</p>
  </div>
</template>

<style scoped>
.crisis-alert {
  background: linear-gradient(135deg, #fef2f2, #fff7ed);
  border: 2px solid #ef4444;
  border-radius: var(--border-radius);
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-4);
}
.crisis-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}
.crisis-icon-wrap {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-full);
  background-color: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crisis-icon {
  width: 20px;
  height: 20px;
}
.crisis-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: #dc2626;
  margin: 0;
}
.crisis-description {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.7;
  margin: 0 0 var(--spacing-4);
}
.crisis-hotlines {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}
.crisis-hotlines-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2);
}
.crisis-hotline-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
.crisis-hotline-list strong {
  color: #dc2626;
}
.crisis-tel {
  color: #dc2626;
  text-decoration: underline;
  font-weight: 600;
}
.crisis-tel:hover {
  color: #b91c1c;
}
.crisis-action {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: #dc2626;
  line-height: 1.6;
  margin: 0;
  padding-top: var(--spacing-2);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}
@media (max-width: 640px) {
  .crisis-alert { padding: var(--spacing-4); }
  .crisis-hotlines { padding: var(--spacing-3); }
}
:root[data-theme="dark"] .crisis-alert {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.3), rgba(124, 45, 18, 0.2));
}
:root[data-theme="dark"] .crisis-hotlines {
  background-color: rgba(0, 0, 0, 0.2);
}
@media print {
  .crisis-alert {
    border: 2px solid #000;
    background: #fff;
    break-inside: avoid;
  }
}
</style>
