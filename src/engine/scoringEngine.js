/**
 * Scoring Engine — pure functions for scoring psychological assessments.
 *
 * Supports eight scoring methods:
 *   "sum"                   — simple sum of answer values (supports scoredItems filter)
 *   "sum_with_reverse"      — sum with reverse-scored items (supports scoredItems filter)
 *   "subscale"              — multiple subscales, each a sum of specific items
 *   "subscale_with_reverse" — subscales + reverse-scored items
 *   "mean_subscale"         — mean of items per subscale (used by TIPI Big Five)
 *   "special_aq10"          — AQ-10 agree/disagree binary scoring
 *   "domain_max"            — sum of per-domain max scores (used by QIDS-SR16)
 */

/**
 * Reverse a single item score.
 * @param {number} value   — the raw answer value
 * @param {number} maxItemScore — the maximum possible score for the item
 * @param {number} minItemScore — the minimum possible score for the item (default 0)
 * @returns {number}
 */
function reverseScore(value, maxItemScore, minItemScore = 0) {
  return (minItemScore + maxItemScore) - value
}

/**
 * Build an item-level detail array and apply reverse scoring where needed.
 *
 * @param {Object}   answers       — { questionIndex: selectedValue }
 * @param {number[]} reverseItems  — 0-based indices of items to reverse
 * @param {number}   maxItemScore  — max score per item (for reverse formula)
 * @param {number}   minItemScore  — min score per item (for reverse formula, default 0)
 * @returns {{ items: Array<{index, raw, scored}>, scoredMap: Object }}
 */
function buildItemDetails(answers, reverseItems = [], maxItemScore = 0, minItemScore = 0) {
  const reverseSet = new Set(reverseItems)
  const items = []
  const scoredMap = {}

  for (const [key, raw] of Object.entries(answers)) {
    const index = Number(key)
    const isReverse = reverseSet.has(index)
    const scored = isReverse ? reverseScore(raw, maxItemScore, minItemScore) : raw
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

function scoreSum(answers, scoring = {}) {
  const { items } = buildItemDetails(answers)
  const scoredSet = scoring.scoredItems ? new Set(scoring.scoredItems) : null
  const total = items
    .filter(item => !scoredSet || scoredSet.has(item.index))
    .reduce((sum, item) => sum + item.scored, 0)
  return { total, subscales: null, items }
}

function scoreSumWithReverse(answers, scoring) {
  const { reverseItems = [], maxItemScore = 0, minItemScore = 0 } = scoring
  const { items } = buildItemDetails(answers, reverseItems, maxItemScore, minItemScore)
  const scoredSet = scoring.scoredItems ? new Set(scoring.scoredItems) : null
  const total = items
    .filter(item => !scoredSet || scoredSet.has(item.index))
    .reduce((sum, item) => sum + item.scored, 0)
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
  const { reverseItems = [], maxItemScore = 0, minItemScore = 0 } = scoring
  const { items, scoredMap } = buildItemDetails(answers, reverseItems, maxItemScore, minItemScore)

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
    const minItem = sub.minItemScore ?? scoring.minItemScore ?? 0

    let sum = 0
    let count = 0

    for (const idx of sub.items) {
      const raw = answers[idx]
      if (raw === undefined || raw === null) continue

      const isReverse = reverseSet.has(idx)
      const scored = isReverse ? reverseScore(raw, maxItem, minItem) : raw

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

function scoreAQ10(answers, scoring) {
  const { items } = buildItemDetails(answers)
  const agreeSet = new Set(scoring.agreeItems || [])
  const disagreeSet = new Set(scoring.disagreeItems || [])

  let total = 0
  for (const item of items) {
    if (agreeSet.has(item.index)) {
      // Score 1 if "Definitely agree" (0) or "Slightly agree" (1)
      if (item.raw <= 1) total += 1
    } else if (disagreeSet.has(item.index)) {
      // Score 1 if "Slightly disagree" (2) or "Definitely disagree" (3)
      if (item.raw >= 2) total += 1
    }
  }

  return { total, subscales: null, items }
}

function scoreDomainMax(answers, scoring) {
  const { items } = buildItemDetails(answers)
  const scoredMap = Object.fromEntries(items.map(i => [i.index, i.scored]))

  let total = 0
  for (const group of scoring.domainGroups) {
    const domainMax = Math.max(...group.map(idx => scoredMap[idx] ?? 0))
    total += domainMax
  }

  return { total, subscales: null, items }
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
  if (!scoring || !scoring.method) {
    console.warn('[scoringEngine] Missing scoring config, falling back to sum')
    return scoreSum(answers || {})
  }
  switch (scoring.method) {
    case 'sum':
      return scoreSum(answers, scoring)
    case 'sum_with_reverse':
      return scoreSumWithReverse(answers, scoring)
    case 'subscale':
      return scoreSubscale(answers, scoring)
    case 'subscale_with_reverse':
      return scoreSubscaleWithReverse(answers, scoring)
    case 'mean_subscale':
      return scoreMeanSubscale(answers, scoring)
    case 'special_aq10':
      return scoreAQ10(answers, scoring)
    case 'domain_max':
      return scoreDomainMax(answers, scoring)
    default:
      console.warn(`Unknown scoring method: "${scoring.method}", falling back to sum`)
      return scoreSum(answers, scoring)
  }
}
