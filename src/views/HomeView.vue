<script setup>
import { onMounted } from 'vue'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useTagFilter } from '@/composables/useTagFilter'
import TagFilter from '@/components/common/TagFilter.vue'
import ScaleCard from '@/components/common/ScaleCard.vue'

const { scales, tags, loading, error, loadIndex } = useScaleLoader()
const { selectedTags, filteredScales, toggleTag, clearTags } = useTagFilter(scales)

onMounted(() => {
  loadIndex()
})
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">心灵探索</h1>
        <p class="hero-subtitle">
          探索内心世界，了解真实的自己
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="container main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>加载失败: {{ error }}</p>
        <button class="btn btn-primary" @click="loadIndex()">重试</button>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Tag Filter -->
        <TagFilter
          v-if="tags.length > 0"
          :tags="tags"
          :selected-tags="selectedTags"
          @toggle="toggleTag"
          @clear="clearTags"
        />

        <!-- Count -->
        <p class="scale-count">
          共 {{ filteredScales.length }} 个量表
        </p>

        <!-- Scale Grid -->
        <div class="scale-grid">
          <ScaleCard
            v-for="scale in filteredScales"
            :key="scale.id"
            :scale="scale"
          />
        </div>

        <!-- Empty State -->
        <div v-if="filteredScales.length === 0 && scales.length > 0" class="empty-state">
          <p>没有匹配的量表</p>
          <button class="btn btn-outline" @click="clearTags">清除筛选</button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: var(--spacing-12) 0 var(--spacing-8);
}

.hero-title {
  font-size: var(--font-size-4xl);
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin-bottom: var(--spacing-3);
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 480px;
  margin: 0 auto;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .hero {
    padding: var(--spacing-8) 0 var(--spacing-6);
  }

  .hero-title {
    font-size: var(--font-size-3xl);
  }

  .hero-subtitle {
    font-size: var(--font-size-base);
  }
}

.main-content {
  padding-bottom: var(--spacing-12);
}

.scale-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-4) 0;
}

.scale-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

@media (min-width: 640px) {
  .scale-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .scale-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-12) 0;
  color: var(--color-text-secondary);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error State */
.error-state {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-danger);
}

.error-state .btn {
  margin-top: var(--spacing-4);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-12) 0;
  color: var(--color-text-secondary);
}

.empty-state .btn {
  margin-top: var(--spacing-4);
}
</style>
