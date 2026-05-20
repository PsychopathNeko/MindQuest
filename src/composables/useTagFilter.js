import { ref, computed } from 'vue'

export function useTagFilter(scales) {
  const selectedTags = ref([])

  const filteredScales = computed(() => {
    if (!scales.value || scales.value.length === 0) {
      return []
    }
    if (selectedTags.value.length === 0) {
      return scales.value
    }
    return scales.value.filter((scale) =>
      scale.tags.some((tag) => selectedTags.value.includes(tag))
    )
  })

  const recommendedTags = computed(() => {
    if (!scales.value || scales.value.length === 0) return []
    const freq = {}
    if (selectedTags.value.length === 0) {
      // No selection: recommend most popular tags by scale count
      for (const s of scales.value) {
        for (const t of s.tags) {
          freq[t] = (freq[t] || 0) + 1
        }
      }
    } else {
      // Has selection: recommend co-occurring tags
      const matched = scales.value.filter((s) =>
        s.tags.some((t) => selectedTags.value.includes(t))
      )
      for (const s of matched) {
        for (const t of s.tags) {
          if (!selectedTags.value.includes(t)) {
            freq[t] = (freq[t] || 0) + 1
          }
        }
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)
  })

  function toggleTag(tagId) {
    const index = selectedTags.value.indexOf(tagId)
    if (index === -1) {
      selectedTags.value.push(tagId)
    } else {
      selectedTags.value.splice(index, 1)
    }
  }

  function clearTags() {
    selectedTags.value = []
  }

  return {
    selectedTags,
    filteredScales,
    recommendedTags,
    toggleTag,
    clearTags,
  }
}
