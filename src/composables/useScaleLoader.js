import { ref } from 'vue'

// Module-level cache
let indexCache = null
const scaleCache = new Map()

const BASE = import.meta.env.BASE_URL

export function useScaleLoader() {
  const index = ref(null)
  const scales = ref([])
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadIndex() {
    if (indexCache) {
      index.value = indexCache
      scales.value = indexCache.scales
      tags.value = indexCache.tags
      return indexCache
    }

    loading.value = true
    error.value = null

    try {
      const url = `${BASE}data/scales/_index.json`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load scale index: ${response.status}`)
      }
      const data = await response.json()
      indexCache = data
      index.value = data
      scales.value = data.scales
      tags.value = data.tags
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to load scale index:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadScale(id) {
    if (scaleCache.has(id)) {
      return scaleCache.get(id)
    }

    loading.value = true
    error.value = null

    try {
      const url = `${BASE}data/scales/${id}.json`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load scale "${id}": ${response.status}`)
      }
      const data = await response.json()
      scaleCache.set(id, data)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to load scale "${id}":`, err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    index,
    scales,
    tags,
    loading,
    error,
    loadIndex,
    loadScale,
  }
}
