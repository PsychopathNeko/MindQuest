/**
 * Report Engine — pure functions for mapping scores to interpretations.
 *
 * Uses the `interpretation` object from each scale's JSON to produce
 * human-readable report objects.
 */

/**
 * Find the matching range for a given score.
 *
 * @param {number} score  — the score to look up
 * @param {Array}  ranges — array of { min, max, level, label, description, suggestions }
 * @returns {Object|null} — the matched range object, or null
 */
function matchRange(score, ranges) {
  if (!ranges || !Array.isArray(ranges)) return null
  return ranges.find((r) => score >= r.min && score <= r.max) ?? null
}

/**
 * Generate a full report from calculated scores and interpretation config.
 *
 * @param {{ total: number, subscales: Array|null, items: Array }} scores
 *   — output from calculateScores()
 * @param {Object} interpretation
 *   — { ranges, subscaleRanges, multiplier? } from scale JSON
 * @returns {{ level, label, description, suggestions, subscaleReports }}
 */
export function generateReport(scores, interpretation) {
  const { ranges, subscaleRanges } = interpretation
  const multiplier = interpretation.multiplier ?? 1

  // Match total score (apply multiplier if present, e.g. DASS-21 x2)
  const lookupTotal = scores.total * multiplier
  const matched = matchRange(lookupTotal, ranges)

  const report = {
    level: matched?.level ?? 'unknown',
    label: matched?.label ?? '--',
    description: matched?.description ?? '',
    suggestions: matched?.suggestions ?? [],
    subscaleReports: null,
  }

  // Match subscale scores if applicable
  if (scores.subscales && subscaleRanges) {
    report.subscaleReports = scores.subscales.map((sub) => {
      const subRanges = subscaleRanges[sub.id]
      const lookupScore = sub.score * multiplier
      const subMatched = matchRange(lookupScore, subRanges)
      return {
        id: sub.id,
        name: sub.name,
        score: sub.score,
        displayScore: lookupScore,
        maxScore: sub.maxScore,
        level: subMatched?.level ?? 'unknown',
        label: subMatched?.label ?? '--',
        description: subMatched?.description ?? '',
      }
    })
  }

  return report
}

/**
 * Get a score as a percentage of the maximum.
 *
 * @param {number} score    — achieved score
 * @param {number} maxScore — maximum possible score
 * @returns {number} — percentage 0-100
 */
export function getScorePercentage(score, maxScore) {
  if (!maxScore || maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

/**
 * Get a CSS color corresponding to a severity level.
 *
 * @param {string} level — one of: minimal, normal, mild, moderate, severe, extremely_severe
 * @returns {string} — CSS color string
 */
export function getSeverityColor(level) {
  switch (level) {
    case 'minimal':
    case 'normal':
      return '#10b981' // green
    case 'mild':
      return '#f59e0b' // amber
    case 'moderate':
      return '#f97316' // orange
    case 'severe':
    case 'extremely_severe':
      return '#ef4444' // red
    default:
      return '#6b7280' // gray for unknown
  }
}
