import { ref, computed, watch } from 'vue'
import { calculateScores } from '@/engine/scoringEngine'
import { generateReport } from '@/engine/reportEngine'

/**
 * State machine composable for managing the assessment flow.
 *
 * @param {import('vue').Ref} scale — reactive ref to the loaded scale JSON
 * @returns assessment state and methods
 */
export function useAssessment(scale) {
  const currentIndex = ref(0)
  const answers = ref({})
  let autoAdvanceTimer = null

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
      const nextUnanswered = findNextUnanswered(currentIndex.value)
      if (nextUnanswered !== -1) {
        currentIndex.value = nextUnanswered
      }
      // If all answered, stay on current question
    }, 300)
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
    }
  }

  function goPrev() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function goTo(index) {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index
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
   */
  function cleanup() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
  }

  // Cleanup timer when scale changes (component unmount scenario)
  watch(scale, () => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    currentIndex.value = 0
    answers.value = {}
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
  }
}
