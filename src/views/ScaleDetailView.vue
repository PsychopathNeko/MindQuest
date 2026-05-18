<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useScaleLoader } from '@/composables/useScaleLoader'

const route = useRoute()
const router = useRouter()
const { loading, error, loadScale } = useScaleLoader()

const scale = ref(null)
const scaleId = route.params.id

onMounted(async () => {
  const data = await loadScale(scaleId)
  scale.value = data
})

function startAssessment() {
  router.push({ name: 'assessment', params: { id: scaleId } })
}

function goHome() {
  router.push({ name: 'home' })
}

function estimateTime(questionCount) {
  // Roughly 15-30 seconds per question
  const minutes = Math.max(1, Math.ceil(questionCount * 0.4))
  return `${minutes} - ${minutes + Math.ceil(minutes * 0.5)}`
}
</script>

<template>
  <div class="scale-detail-view">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error || !scale" class="error-state">
        <div class="error-icon">!</div>
        <p class="error-text">{{ error || '量表加载失败' }}</p>
        <button class="btn btn-primary" @click="goHome">返回首页</button>
      </div>

      <!-- Scale Detail -->
      <template v-else>
        <div class="detail-card card">
          <!-- Header -->
          <div class="detail-header">
            <div class="name-row">
              <h1 class="scale-name">{{ scale.meta.name }}</h1>
              <span class="scale-badge">{{ scale.meta.id.toUpperCase() }}</span>
            </div>
            <p class="scale-fullname">{{ scale.meta.fullName }}</p>
          </div>

          <!-- Description -->
          <div class="detail-section">
            <p class="scale-description">{{ scale.meta.description }}</p>
          </div>

          <!-- Meta Info -->
          <div class="detail-section meta-grid">
            <div class="meta-item">
              <span class="meta-label">作者</span>
              <span class="meta-value">{{ scale.meta.author }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">题目数量</span>
              <span class="meta-value">{{ scale.questions.length }} 题</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">预计时间</span>
              <span class="meta-value">{{ estimateTime(scale.questions.length) }} 分钟</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">许可</span>
              <span class="meta-value">{{ scale.meta.license }}</span>
            </div>
          </div>

          <!-- Reference -->
          <div class="detail-section">
            <p class="meta-label">参考文献</p>
            <p class="reference-text">{{ scale.meta.reference }}</p>
          </div>

          <!-- Instruction -->
          <div class="detail-section instruction-section">
            <p class="meta-label">测评指导语</p>
            <div class="instruction-box">
              <p class="instruction-text">{{ scale.meta.instruction }}</p>
            </div>
          </div>

          <!-- Action -->
          <div class="detail-actions">
            <button class="btn btn-outline" @click="goHome">返回首页</button>
            <button class="btn btn-primary btn-lg" @click="startAssessment">
              开始测评
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.scale-detail-view {
  padding: var(--spacing-8) 0 var(--spacing-12);
}

.detail-card {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--spacing-8);
}

.detail-header {
  margin-bottom: var(--spacing-6);
}

.name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-2);
}

.scale-name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.scale-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-primary);
  background-color: rgba(99, 102, 241, 0.1);
  border-radius: var(--border-radius-full);
  letter-spacing: 0.5px;
}

.scale-fullname {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-style: italic;
}

.detail-section {
  padding: var(--spacing-4) 0;
  border-top: 1px solid var(--color-border);
}

.scale-description {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.7;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-1);
}

.meta-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.reference-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.instruction-box {
  padding: var(--spacing-4);
  background-color: rgba(99, 102, 241, 0.05);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary);
}

.instruction-text {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-8);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-border);
}

.btn-lg {
  padding: var(--spacing-3) var(--spacing-8);
  font-size: var(--font-size-base);
  font-weight: 600;
}

/* Loading */
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

/* Error */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-12) 0;
  text-align: center;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-full);
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  font-size: var(--font-size-xl);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-text {
  color: var(--color-danger);
  font-size: var(--font-size-base);
}

@media (max-width: 640px) {
  .detail-card {
    padding: var(--spacing-6);
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column-reverse;
  }

  .detail-actions .btn {
    width: 100%;
  }
}
</style>
