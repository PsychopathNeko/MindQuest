import { ref, computed, watch } from 'vue'
import { calculateScores } from '@/engine/scoringEngine'
import { generateReport } from '@/engine/reportEngine'

/**
 * State machine composable for managing the assessment flow.
 *
 * @param {import('vue').Ref} scale — reactive ref to the loaded scale JSON
 * @param {import('vue').Ref} [scaleId] — optional reactive ref to the scale identifier (used for sessionStorage key)
 * @returns assessment state and methods
 */
export function useAssessment(scale, scaleId) {
  const currentIndex = ref(0)
  const answers = ref({})
  let autoAdvanceTimer = null
  let disposed = false

  const STORAGE_PREFIX = 'mindquest_progress_'

  function getStorageKey() {
    const id = scaleId?.value || scale.value?.meta?.id
    return id ? STORAGE_PREFIX + id : null
  }

  function saveProgress() {
    if (typeof sessionStorage === 'undefined') return
    const key = getStorageKey()
    if (!key) return
    try {
      sessionStorage.setItem(key, JSON.stringify({
        currentIndex: currentIndex.value,
        answers: answers.value
      }))
    } catch {}
  }

  function restoreProgress() {
    if (typeof sessionStorage === 'undefined') return
    const key = getStorageKey()
    if (!key) return
    try {
      const raw = sessionStorage.getItem(key)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.answers && typeof saved.answers === 'object') {
          answers.value = saved.answers
        }
        if (typeof saved.currentIndex === 'number' && saved.currentIndex >= 0) {
          currentIndex.value = saved.currentIndex
        }
      }
    } catch {}
  }

  function clearProgress() {
    if (typeof sessionStorage === 'undefined') return
    const key = getStorageKey()
    if (key) {
      try { sessionStorage.removeItem(key) } catch {}
    }
  }

  const questions = computed(() => {
    return scale.value?.questions ?? []
  })

  const currentQuestion = computed(() => {
    return questions.value[currentIndex.value] ?? null
  })

  const isComplete = computed(() => {
    const total = questions.value.length
    if (total === 0) return false
    return Object.keys(answers.value).length >= total
  })

  const progress = computed(() => ({
    current: Object.keys(answers.value).length,
    total: questions.value.length,
  }))

  const canGoBack = computed(() => {
    return currentIndex.value > 0
  })

  const canGoForward = computed(() => {
    return answers.value[currentIndex.value] !== undefined
  })

  /**
   * Record answer for current question, then auto-advance
   * to the next unanswered question after a brief delay.
   */
  function selectAnswer(value) {
    answers.value = { ...answers.value, [currentIndex.value]: value }

    // Clear any pending auto-advance
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }

    // Auto-advance after 300ms
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null
      if (disposed) return
      const nextUnanswered = findNextUnanswered(currentIndex.value)
      if (nextUnanswered !== -1) {
        currentIndex.value = nextUnanswered
      }
      // If all answered, stay on current question
    }, 300)

    saveProgress()
  }

  /**
   * Find the next unanswered question index after the given index.
   * Wraps around to search from the beginning if needed.
   * Returns -1 if all questions are answered.
   */
  function findNextUnanswered(afterIndex) {
    const total = questions.value.length
    // Search forward from afterIndex + 1
    for (let i = afterIndex + 1; i < total; i++) {
      if (answers.value[i] === undefined) return i
    }
    // Wrap around: search from 0 to afterIndex
    for (let i = 0; i <= afterIndex; i++) {
      if (answers.value[i] === undefined) return i
    }
    return -1
  }

  function goNext() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      saveProgress()
    }
  }

  function goPrev() {
    if (currentIndex.value > 0) {
      currentIndex.value--
      saveProgress()
    }
  }

  function goTo(index) {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index
      saveProgress()
    }
  }

  /**
   * Calculate scores and generate report using the scoring and report engines.
   *
   * @returns {{ answers: Object, scores: Object, report: Object }}
   */
  function getResults() {
    const scoring = scale.value?.scoring
    const interpretation = scale.value?.interpretation

    const scores = calculateScores(answers.value, scoring)
    const report = generateReport(scores, interpretation)

    return {
      answers: { ...answers.value },
      scores,
      report,
    }
  }

  /**
   * Clean up any pending auto-advance timer.
   * Should be called when the component unmounts.
   * Does NOT clear storage — user might come back.
   */
  function cleanup() {
    disposed = true
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
  }

  // Handle scale changes: restore on first load, reset on scale switch
  watch(scale, (newVal, oldVal) => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    if (oldVal == null && newVal) {
      // First load — try to restore saved progress
      restoreProgress()
    } else {
      // Scale actually changed — reset
      currentIndex.value = 0
      answers.value = {}
    }
  })

  return {
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
    cleanup,
    clearProgress,
  }
}
