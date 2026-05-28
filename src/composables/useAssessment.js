import { ref, computed, watch } from 'vue'
import { calculateScores } from '../engine/scoringEngine'
import { generateReport } from '../engine/reportEngine'
import { saveDraft, clearDraft } from '../utils/storage'

export function useAssessment(scale, externalScaleId) {
  const currentIndex = ref(0)
  const answers = ref({})
  let autoAdvanceTimer = null
  let draftTimer = null

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

  function selectAnswer(value) {
    answers.value = { ...answers.value, [currentIndex.value]: value }

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }

    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null
      const nextUnanswered = findNextUnanswered(currentIndex.value)
      if (nextUnanswered !== -1) {
        currentIndex.value = nextUnanswered
      }
    }, 300)
  }

  function findNextUnanswered(afterIndex) {
    const total = questions.value.length
    for (let i = afterIndex + 1; i < total; i++) {
      if (answers.value[i] === undefined) return i
    }
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

  function getResults() {
    const scoring = scale.value?.scoring
    const interpretation = scale.value?.interpretation

    const scores = calculateScores(answers.value, scoring)
    const report = generateReport(scores, interpretation)

    return { answers: { ...answers.value }, scores, report }
  }

  function cleanup() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    if (draftTimer) {
      clearTimeout(draftTimer)
      draftTimer = null
    }
  }

  watch(scale, () => {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    currentIndex.value = 0
    answers.value = {}
  })

  watch(answers, (newAnswers) => {
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(() => {
      draftTimer = null
      if (scale.value && Object.keys(newAnswers).length > 0) {
        saveDraft(externalScaleId?.value || scale.value.meta?.id || '', {
          answers: newAnswers,
          currentIndex: currentIndex.value,
          questionCount: questions.value.length,
        })
      }
    }, 500)
  }, { deep: true })

  function restoreDraft(draft) {
    if (draft && draft.answers) {
      answers.value = { ...draft.answers }
      if (typeof draft.currentIndex === 'number') {
        currentIndex.value = draft.currentIndex
      }
    }
  }

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
    restoreDraft,
  }
}
