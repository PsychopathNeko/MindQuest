<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'

const route = useRoute()

useHead({
  htmlAttrs: { lang: 'zh-CN' },
  link: [{ rel: 'canonical', href: computed(() => `https://psychopathneko.github.io/MindQuest${route.path}`) }],
})
const sidebarOpen = ref(false)

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div class="app-layout">
    <a href="#main-content" class="skip-link">Skip to content</a>
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="app-body">
      <AppSidebar
        v-if="route.name !== 'assessment'"
        :open="sidebarOpen"
        @close="sidebarOpen = false"
      />
      <main id="main-content" class="app-main" :class="{ 'no-sidebar': route.name === 'assessment' }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
}

.app-main {
  flex: 1;
  min-width: 0;
}

@media (min-width: 768px) {
  .app-main {
    margin-left: var(--sidebar-width);
  }
  .app-main.no-sidebar {
    margin-left: 0;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--spacing-4);
  z-index: 200;
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  transition: top 0.2s;
}
.skip-link:focus {
  top: var(--spacing-2);
}
</style>
