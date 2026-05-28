/**
 * Report Engine — pure functions for mapping scores to interpretations.
 */

function matchRange(score, ranges) {
  if (!ranges || !Array.isArray(ranges)) return null
  return ranges.find((r) => score >= r.min && score <= r.max) ?? null
}

export function generateReport(scores, interpretation) {
  if (!interpretation) {
    return {
      level: 'unknown',
      label: '--',
      description: '',
      suggestions: [],
      subscaleReports: null,
    }
  }
  const { ranges, subscaleRanges } = interpretation
  const multiplier = interpretation.multiplier ?? 1

  const lookupTotal = scores.total * multiplier
  const matched = matchRange(lookupTotal, ranges)

  const report = {
    level: matched?.level ?? 'unknown',
    label: matched?.label ?? '--',
    description: matched?.description ?? '',
    suggestions: matched?.suggestions ?? [],
    subscaleReports: null,
  }

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

export function getScorePercentage(score, maxScore) {
  if (!maxScore || maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

export function getSeverityColor(level) {
  switch (level) {
    case 'none':
    case 'normal':
    case 'minimal':
    case 'good':
    case 'strong':
      return '#10b981'
    case 'low':
      return '#14b8a6'
    case 'mild':
    case 'possible':
    case 'borderline':
      return '#f59e0b'
    case 'moderate':
    case 'elevated':
    case 'at_risk':
      return '#f97316'
    case 'high':
    case 'significant':
      return '#f87171'
    case 'severe':
    case 'very_severe':
    case 'extremely_severe':
    case 'very_high':
    case 'clinical':
    case 'abnormal':
    case 'alexithymia':
      return '#ef4444'
    default:
      return '#7da2f7'
  }
}
