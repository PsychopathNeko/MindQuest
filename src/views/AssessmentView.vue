<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useAssessment } from '@/composables/useAssessment'
import { saveAssessment } from '@/utils/storage'
import ProgressBar from '@/components/common/ProgressBar.vue'
import QuestionRenderer from '@/components/questions/QuestionRenderer.vue'

const route = useRoute()
const router = useRouter()
const { loading, error, loadScale } = useScaleLoader()

const scale = ref(null)
const scaleId = route.params.id

const {
  currentIndex,
  answers,
  isComplete,
  progress,
  currentQuestion,
  canGoBack,
  canGoForward,
  selectAnswer,
  goNext,
  goPrev,
  goTo,
  getResults,
} = useAssessment(scale)

// Slide direction for transitions
const slideDirection = ref('left')
const showInstruction = ref(false)

// Compute choices for the current question
const currentChoices = computed(() => {
  if (!currentQuestion.value || !scale.value) return []
  return currentQuestion.value.choices || scale.value.commonChoices || []
})

// Current answer value
const currentAnswer = computed(() => {
  return answers.value[currentIndex.value] ?? null
})

// Handle answer selection
function handleAnswerSelect(value) {
  selectAnswer(value)
}

// Navigate with direction tracking
function handlePrev() {
  slideDirection.value = 'right'
  goPrev()
}

function handleNext() {
  slideDirection.value = 'left'
  goNext()
}

function handleDotClick(index) {
  slideDirection.value = index > currentIndex.value ? 'left' : 'right'
  goTo(index)
}

// Keyboard support
function handleKeydown(e) {
  // Number keys to select answer
  if (e.key >= '0' && e.key <= '9') {
    const num = parseInt(e.key)
    const choices = currentChoices.value
    // Find the matching choice by value
    const match = choices.find((c) => c.value === num)
    if (match) {
      handleAnswerSelect(match.value)
      return
    }
    // Or by index (1-based)
    if (num >= 1 && num <= choices.length) {
      handleAnswerSelect(choices[num - 1].value)
      return
    }
  }
  // Arrow keys for navigation
  if (e.key === 'ArrowLeft' && canGoBack.value) {
    handlePrev()
  } else if (e.key === 'ArrowRight' && canGoForward.value) {
    handleNext()
  }
}

// Submit results
function submitResults() {
  const { answers: answerData, scores, report } = getResults()
  const timestamp = Date.now()

  const result = {
    scaleId,
    scaleName: scale.value.meta.name,
    timestamp,
    answers: answerData,
    scores,
    report,
  }

  const key = saveAssessment(result)
  router.push({ name: 'report', params: { id: scaleId }, query: { key } })
}

// Exit confirmation
function confirmExit() {
  const answered = Object.keys(answers.value).length
  if (answered === 0) {
    router.push({ name: 'scale-detail', params: { id: scaleId } })
    return
  }
  if (confirm('确定要退出测评吗？当前进度将不会保存。')) {
    router.push({ name: 'scale-detail', params: { id: scaleId } })
  }
}

// Route guard for accidental navigation
onBeforeRouteLeave((_to, _from, next) => {
  const answered = Object.keys(answers.value).length
  const total = scale.value?.questions?.length || 0
  if (answered > 0 && answered < total) {
    if (confirm('确定要离开吗？当前进度将不会保存。')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

onMounted(async () => {
  const data = await loadScale(scaleId)
  scale.value = data
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="assessment-view">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载量表中...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error || !scale" class="error-state">
        <p class="error-text">{{ error || '量表加载失败' }}</p>
        <button class="btn btn-primary" @click="router.push({ name: 'home' })">返回首页</button>
      </div>

      <!-- Assessment Content -->
      <template v-else>
        <div class="assessment-content">
          <!-- Top Bar -->
          <div class="top-bar">
            <button class="btn btn-outline btn-sm" @click="confirmExit">退出测评</button>
            <span class="scale-title">{{ scale.meta.name }}</span>
            <button
              class="btn btn-outline btn-sm"
              @click="showInstruction = !showInstruction"
            >
              {{ showInstruction ? '收起' : '指导语' }}
            </button>
          </div>

          <!-- Instruction (collapsible) -->
          <transition name="collapse">
            <div v-if="showInstruction" class="instruction-banner">
              <p>{{ scale.meta.instruction }}</p>
            </div>
          </transition>

          <!-- Progress -->
          <div class="progress-section">
            <ProgressBar
              :current="progress.current"
              :total="progress.total"
            />
          </div>

          <!-- Question Area -->
          <div class="question-area">
            <div class="question-number">
              第 {{ currentIndex + 1 }} / {{ scale.questions.length }} 题
            </div>

            <transition :name="'slide-' + slideDirection" mode="out-in">
              <div class="question-content" :key="currentIndex">
                <QuestionRenderer
                  :question="currentQuestion"
                  :choices="currentChoices"
                  :model-value="currentAnswer"
                  @update:model-value="handleAnswerSelect"
                />
              </div>
            </transition>
          </div>

          <!-- Navigation -->
          <div class="nav-section">
            <div class="nav-buttons">
              <button
                class="btn btn-outline"
                :disabled="!canGoBack"
                @click="handlePrev"
              >
                上一题
              </button>

              <button
                v-if="!isComplete"
                class="btn btn-primary"
                :disabled="!canGoForward"
                @click="handleNext"
              >
                下一题
              </button>

              <button
                v-else
                class="btn btn-primary btn-submit"
                @click="submitResults"
              >
                查看结果
              </button>
            </div>
          </div>

          <!-- Question Dots -->
          <div class="dots-section">
            <div class="dots-container">
              <button
                v-for="(q, i) in scale.questions"
                :key="i"
                class="dot"
                :class="{
                  answered: answers[i] !== undefined,
                  current: i === currentIndex,
                }"
                @click="handleDotClick(i)"
                :title="'第 ' + (i + 1) + ' 题'"
                type="button"
              ></button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>


<style scoped>
.assessment-view {
  padding: var(--spacing-4) 0 var(--spacing-8);
}

.assessment-content {
  max-width: 640px;
  margin: 0 auto;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.scale-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--font-size-xs);
}

/* Instruction */
.instruction-banner {
  padding: var(--spacing-3) var(--spacing-4);
  background-color: rgba(59, 130, 246, 0.05);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary);
  margin-bottom: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 200px;
}

/* Progress */
.progress-section {
  margin-bottom: var(--spacing-6);
}

/* Question Area */
.question-area {
  min-height: 360px;
}

.question-number {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  margin-bottom: var(--spacing-4);
}

.question-content {
  padding: var(--spacing-4) 0;
}

/* Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease;
}

.slide-left-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* Navigation */
.nav-section {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.nav-buttons .btn {
  min-width: 100px;
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  font-weight: 600;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

/* Dots */
.dots-section {
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
}

.dots-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-2);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: var(--border-radius-full);
  border: 2px solid var(--color-border);
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.dot:hover {
  border-color: var(--color-primary-light);
}

.dot.answered {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.dot.current {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.dot.current.answered {
  background-color: var(--color-primary);
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

.error-text {
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .assessment-view {
    padding: var(--spacing-2) 0 var(--spacing-6);
  }

  .question-area {
    min-height: 300px;
  }

  .nav-buttons .btn {
    min-width: 80px;
  }
}
</style>
