import { computed } from 'vue'

export function useRecommendation(scales, assessments) {
  const recommendations = computed(() => {
    if (!scales.value?.length || !assessments.value?.length) return []

    // Get completed scale IDs
    const completedIds = new Set(assessments.value.map(a => a.data?.scaleId))

    // Get tags from completed scales
    const completedTags = {}
    for (const s of scales.value) {
      if (completedIds.has(s.id)) {
        for (const tag of (s.tags || [])) {
          completedTags[tag] = (completedTags[tag] || 0) + 1
        }
      }
    }

    if (Object.keys(completedTags).length === 0) return []

    // Score uncompleted scales by tag overlap
    const candidates = scales.value
      .filter(s => !completedIds.has(s.id))
      .map(s => {
        let score = 0
        for (const tag of (s.tags || [])) {
          if (completedTags[tag]) {
            score += completedTags[tag]
          }
        }
        return { ...s, relevanceScore: score }
      })
      .filter(c => c.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)

    return candidates
  })

  return { recommendations }
}
