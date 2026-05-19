<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useScaleLoader } from '@/composables/useScaleLoader'
import { useAssessment } from '@/composables/useAssessment'
import { useLocale } from '@/composables/useLocale'
import { saveAssessment } from '@/utils/storage'
import ProgressBar from '@/components/common/ProgressBar.vue'
import QuestionRenderer from '@/components/questions/QuestionRenderer.vue'

const route = useRoute()
const router = useRouter()
const { loading, error, loadScale } = useScaleLoader()
const { t } = useLocale()

const scale = ref(null)
const scaleId = computed(() => route.params.id)

const {
  currentIndex, answers, isComplete, progress, currentQuestion,
  canGoBack, canGoForward, selectAnswer, goNext, goPrev, goTo, getResults, cleanup,
} = useAssessment(scale)

const slideDirection = ref('left')
const showInstruction = ref(true)

const currentChoices = computed(() => {
  if (!currentQuestion.value || !scale.value) return []
  return currentQuestion.value.choices || scale.value.commonChoices || []
})

const currentAnswer = computed(() => {
  return answers.value[currentIndex.value] ?? null
})

function handleAnswerSelect(value) { selectAnswer(value) }
function handlePrev() { slideDirection.value = 'right'; goPrev() }
function handleNext() { slideDirection.value = 'left'; goNext() }
function handleDotClick(index) { slideDirection.value = index > currentIndex.value ? 'left' : 'right'; goTo(index) }

function handleKeydown(e) {
  if (e.key >= '0' && e.key <= '9') {
    const num = parseInt(e.key)
    const choices = currentChoices.value
    const match = choices.find((c) => c.value === num)
    if (match) { handleAnswerSelect(match.value); return }
    if (num >= 1 && num <= choices.length) { handleAnswerSelect(choices[num - 1].value); return }
  }
  if (e.key === 'ArrowLeft' && canGoBack.value) handlePrev()
  else if (e.key === 'ArrowRight' && canGoForward.value) handleNext()
}

function submitResults() {
  const { answers: answerData, scores, report } = getResults()
  const timestamp = Date.now()
  const result = { scaleId: scaleId.value, scaleName: scale.value.meta.name, timestamp, answers: answerData, scores, report }
  const key = saveAssessment(result)
  if (typeof umami !== 'undefined') {
    umami.track('scale_completed', { scaleId: scaleId.value, scaleName: scale.value.meta.name })
  }
  fetch('https://api.counterapi.dev/v1/mindquest-psychopathneko/scale_completed/up').catch(() => {})
  router.push({ name: 'report', params: { id: scaleId.value }, query: { key } })
}

function confirmExit() {
  const answered = Object.keys(answers.value).length
  if (answered === 0) { router.push({ name: 'scale-detail', params: { id: scaleId.value } }); return }
  if (confirm(t('assess.confirmExit'))) { router.push({ name: 'scale-detail', params: { id: scaleId.value } }) }
}

onBeforeRouteLeave((_to, _from, next) => {
  const answered = Object.keys(answers.value).length
  const total = scale.value?.questions?.length || 0
  if (answered > 0 && answered < total) {
    if (confirm(t('assess.confirmLeave'))) { next() } else { next(false) }
  } else { next() }
})

onMounted(async () => {
  const data = await loadScale(scaleId.value)
  scale.value = data
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  cleanup()
})
</script>
<template>
  <div class="assessment-view">
    <div class="container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('assess.loading') }}</p>
      </div>

      <div v-else-if="error || !scale" class="error-state">
        <p class="error-text">{{ error || t('assess.loadError') }}</p>
        <button class="btn btn-primary" @click="router.push({ name: 'home' })">{{ t('assess.backHome') }}</button>
      </div>

      <template v-else>
        <div class="assessment-content">
          <div class="top-bar">
            <button class="btn btn-outline btn-sm" @click="confirmExit">{{ t('assess.exit') }}</button>
            <span class="scale-title">{{ scale.meta.name }} <span class="top-bar-progress">{{ progress.current }}/{{ progress.total }}</span></span>
            <button class="btn btn-outline btn-sm" @click="showInstruction = !showInstruction">
              {{ showInstruction ? t('assess.hideInstruction') : t('assess.showInstruction') }}
            </button>
          </div>

          <transition name="collapse">
            <div v-if="showInstruction" class="instruction-banner"><p>{{ scale.meta.instruction }}</p></div>
          </transition>

          <div class="progress-section">
            <ProgressBar :current="progress.current" :total="progress.total" />
          </div>

          <div class="question-area">
            <div class="question-number">{{ t('assess.questionNumber', { current: currentIndex + 1, total: scale.questions.length }) }}</div>
            <transition :name="'slide-' + slideDirection" mode="out-in">
              <div class="question-content" :key="currentIndex">
                <QuestionRenderer :question="currentQuestion" :choices="currentChoices" :model-value="currentAnswer" @update:model-value="handleAnswerSelect" />
              </div>
            </transition>
          </div>

          <div class="nav-section">
            <div class="nav-buttons">
              <button class="btn btn-outline" :disabled="!canGoBack" @click="handlePrev">{{ t('assess.prev') }}</button>
              <button v-if="!isComplete" class="btn btn-primary" :disabled="!canGoForward" @click="handleNext">{{ t('assess.next') }}</button>
              <button v-else class="btn btn-primary btn-submit" @click="submitResults">{{ t('assess.viewResults') }}</button>
            </div>
          </div>

          <div class="dots-section">
            <div class="dots-container">
              <button v-for="(q, i) in scale.questions" :key="i" class="dot" :class="{ answered: answers[i] !== undefined, current: i === currentIndex }" @click="handleDotClick(i)" type="button"></button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.assessment-view { padding: var(--spacing-4) 0 var(--spacing-8); }
.assessment-content { max-width: 640px; margin: 0 auto; }
.top-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-3); margin-bottom: var(--spacing-4); }
.scale-title { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); text-align: center; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.top-bar-progress { font-size: var(--font-size-xs); font-weight: 400; color: var(--color-primary); margin-left: var(--spacing-2); }
.btn-sm { padding: var(--spacing-1) var(--spacing-3); font-size: var(--font-size-xs); }
.instruction-banner { padding: var(--spacing-3) var(--spacing-4); background-color: rgba(125, 162, 247, 0.05); border-radius: var(--border-radius-sm); border-left: 3px solid var(--color-primary); margin-bottom: var(--spacing-4); font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.6; }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; margin-bottom: 0; }
.collapse-enter-to, .collapse-leave-from { opacity: 1; max-height: 200px; }
.progress-section { margin-bottom: var(--spacing-6); }
.question-area { min-height: 360px; }
.question-number { font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 500; margin-bottom: var(--spacing-4); }
.question-content { padding: var(--spacing-4) 0; }
.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active { transition: all 0.25s ease; }
.slide-left-enter-from { transform: translateX(30px); opacity: 0; }
.slide-left-leave-to { transform: translateX(-30px); opacity: 0; }
.slide-right-enter-from { transform: translateX(-30px); opacity: 0; }
.slide-right-leave-to { transform: translateX(30px); opacity: 0; }
.nav-section { margin-top: var(--spacing-6); padding-top: var(--spacing-4); border-top: 1px solid var(--color-border); }
.nav-buttons { display: flex; justify-content: space-between; gap: var(--spacing-4); }
.nav-buttons .btn { min-width: 100px; }
.btn-submit { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); border: none; font-weight: 600; animation: pulse-glow 2s ease-in-out infinite; }
@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(125, 162, 247, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(125, 162, 247, 0); } }
.dots-section { margin-top: var(--spacing-6); padding-top: var(--spacing-4); }
.dots-container { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--spacing-2); }
.dot { width: 12px; height: 12px; border-radius: var(--border-radius-full); border: 2px solid var(--color-border); background-color: transparent; cursor: pointer; transition: all 0.2s ease; padding: 0; }
.dot:hover { border-color: var(--color-primary-light); }
.dot.answered { background-color: var(--color-primary); border-color: var(--color-primary); }
.dot.current { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(125, 162, 247, 0.3); }
.dot.current.answered { background-color: var(--color-primary); }
.loading-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4); padding: var(--spacing-12) 0; color: var(--color-text-secondary); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-4); padding: var(--spacing-12) 0; text-align: center; }
.error-text { color: var(--color-danger); }
@media (max-width: 640px) {
  .assessment-view { padding: var(--spacing-2) 0 var(--spacing-6); }
  .question-area { min-height: 260px; }
  .nav-buttons .btn { min-width: 80px; }
  .top-bar { gap: var(--spacing-2); }
  .scale-title { font-size: var(--font-size-xs); }
  .btn-sm { padding: var(--spacing-1) var(--spacing-2); font-size: 11px; white-space: nowrap; }
  .instruction-banner { font-size: var(--font-size-xs); padding: var(--spacing-2) var(--spacing-3); }
  .dots-container { gap: var(--spacing-1); }
  .dot { width: 10px; height: 10px; }
}

@media (max-width: 374px) {
  .top-bar { gap: var(--spacing-1); }
  .scale-title { font-size: 11px; }
  .top-bar-progress { display: none; }
  .nav-buttons .btn { min-width: 70px; font-size: var(--font-size-xs); }
}
</style>
