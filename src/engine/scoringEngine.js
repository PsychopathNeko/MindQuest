/**
 * Scoring Engine — pure functions for scoring psychological assessments.
 *
 * Supports five scoring methods:
 *   "sum"                 — simple sum of answer values
 *   "sum_with_reverse"    — sum with reverse-scored items
 *   "subscale"            — multiple subscales, each a sum of specific items
 *   "subscale_with_reverse" — subscales + reverse-scored items
 *   "mean_subscale"       — mean of items per subscale (used by TIPI Big Five)
 */

/**
 * Reverse a single item score.
 * @param {number} value   — the raw answer value
 * @param {number} maxItemScore — the maximum possible score for the item
 * @returns {number}
 */
function reverseScore(value, maxItemScore) {
  return maxItemScore - value
}

/**
 * Build an item-level detail array and apply reverse scoring where needed.
 *
 * @param {Object}   answers       — { questionIndex: selectedValue }
 * @param {number[]} reverseItems  — 0-based indices of items to reverse
 * @param {number}   maxItemScore  — max score per item (for reverse formula)
 * @returns {{ items: Array<{index, raw, scored}>, scoredMap: Object }}
 */
function buildItemDetails(answers, reverseItems = [], maxItemScore = 0) {
  const reverseSet = new Set(reverseItems)
  const items = []
  const scoredMap = {}

  for (const [key, raw] of Object.entries(answers)) {
    const index = Number(key)
    const isReverse = reverseSet.has(index)
    const scored = isReverse ? reverseScore(raw, maxItemScore) : raw
    items.push({ index, raw, scored })
    scoredMap[index] = scored
  }

  // Sort by index for consistent ordering
  items.sort((a, b) => a.index - b.index)

  return { items, scoredMap }
}

/* ------------------------------------------------------------------ */
/*  Scoring method implementations                                    */
/* ------------------------------------------------------------------ */

function scoreSum(answers) {
  const { items } = buildItemDetails(answers)
  const total = items.reduce((sum, item) => sum + item.scored, 0)
  return { total, subscales: null, items }
}

function scoreSumWithReverse(answers, scoring) {
  const { reverseItems = [], maxItemScore = 0 } = scoring
  const { items } = buildItemDetails(answers, reverseItems, maxItemScore)
  const total = items.reduce((sum, item) => sum + item.scored, 0)
  return { total, subscales: null, items }
}

function scoreSubscale(answers, scoring) {
  const { items, scoredMap } = buildItemDetails(answers)

  const subscales = scoring.subscales.map((sub) => {
    const score = sub.items.reduce((sum, idx) => sum + (scoredMap[idx] ?? 0), 0)
    const maxScore = sub.maxScore ?? sub.items.length * (scoring.maxItemScore ?? 3)
    return { id: sub.id, name: sub.name, score, maxScore }
  })

  const total = subscales.reduce((sum, s) => sum + s.score, 0)

  return { total, subscales, items }
}

function scoreSubscaleWithReverse(answers, scoring) {
  const { reverseItems = [], maxItemScore = 0 } = scoring
  const { items, scoredMap } = buildItemDetails(answers, reverseItems, maxItemScore)

  const subscales = scoring.subscales.map((sub) => {
    const score = sub.items.reduce((sum, idx) => sum + (scoredMap[idx] ?? 0), 0)
    const maxScore = sub.maxScore ?? sub.items.length * (maxItemScore || 3)
    return { id: sub.id, name: sub.name, score, maxScore }
  })

  const total = subscales.reduce((sum, s) => sum + s.score, 0)

  return { total, subscales, items }
}

function scoreMeanSubscale(answers, scoring) {
  // Each subscale may define its own reverseItems and maxItemScore
  const allItems = []
  const processedIndices = new Set()

  const subscales = scoring.subscales.map((sub) => {
    const reverseSet = new Set(sub.reverseItems ?? [])
    const maxItem = sub.maxItemScore ?? scoring.maxItemScore ?? 7

    let sum = 0
    let count = 0

    for (const idx of sub.items) {
      const raw = answers[idx]
      if (raw === undefined || raw === null) continue

      const isReverse = reverseSet.has(idx)
      const scored = isReverse ? reverseScore(raw, maxItem) : raw

      sum += scored
      count += 1

      if (!processedIndices.has(idx)) {
        allItems.push({ index: idx, raw, scored })
        processedIndices.add(idx)
      }
    }

    const score = count > 0 ? Math.round((sum / count) * 100) / 100 : 0
    const maxScore = maxItem

    return { id: sub.id, name: sub.name, score, maxScore }
  })

  allItems.sort((a, b) => a.index - b.index)

  // For mean_subscale, total is not particularly meaningful but we provide
  // the sum of subscale means for completeness
  const total = Math.round(subscales.reduce((s, sub) => s + sub.score, 0) * 100) / 100

  return { total, subscales, items: allItems }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Calculate scores for a completed assessment.
 *
 * @param {Object} answers   — { questionIndex: selectedValue }
 * @param {Object} scoring   — scoring config from the scale JSON
 * @returns {{ total: number, subscales: Array|null, items: Array }}
 */
export function calculateScores(answers, scoring) {
  switch (scoring.method) {
    case 'sum':
      return scoreSum(answers)
    case 'sum_with_reverse':
      return scoreSumWithReverse(answers, scoring)
    case 'subscale':
      return scoreSubscale(answers, scoring)
    case 'subscale_with_reverse':
      return scoreSubscaleWithReverse(answers, scoring)
    case 'mean_subscale':
      return scoreMeanSubscale(answers, scoring)
    default:
      console.warn(`Unknown scoring method: "${scoring.method}", falling back to sum`)
      return scoreSum(answers)
  }
}
