/**
 * Scoring Engine — pure functions for scoring psychological assessments.
 */

function reverseScore(value, maxItemScore, minItemScore = 0) {
  return (minItemScore + maxItemScore) - value
}

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

  items.sort((a, b) => a.index - b.index)
  return { items, scoredMap }
}

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
      if (item.raw <= 1) total += 1
    } else if (disagreeSet.has(item.index)) {
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
