<template>
  <footer class="app-footer">
    <div class="footer-inner container">
      <p class="footer-disclaimer">
        本站量表仅供自我了解参考，不构成医学诊断。如有心理健康困扰，请咨询专业人士。
      </p>
      <p class="footer-copyright">
        &copy; {{ new Date().getFullYear() }} MindQuest
      </p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
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
