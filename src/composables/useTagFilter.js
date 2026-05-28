import { ref, computed } from 'vue'

export function useTagFilter(scales) {
  const selectedTags = ref([])

  const filteredScales = computed(() => {
    if (!scales.value || scales.value.length === 0) return []
    if (selectedTags.value.length === 0) return scales.value
    return scales.value.filter((scale) =>
      scale.tags.some((tag) => selectedTags.value.includes(tag))
    )
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

  return { selectedTags, filteredScales, toggleTag, clearTags }
}
