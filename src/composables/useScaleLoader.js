import { ref } from 'vue'
import { useLocale } from './useLocale'

let rawIndexCache = null
const scaleCache = new Map()

const BASE = import.meta.env.BASE_URL

function resolveLocalized(val, lang) {
  if (val && typeof val === 'object' && (val.zh || val.en)) {
    return val[lang] || val.zh || ''
  }
  return val || ''
}

export function useScaleLoader() {
  const { locale } = useLocale()
  const index = ref(null)
  const scales = ref([])
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)

  function resolveIndex(rawData, lang) {
    const tagMap = {}
    const tags = rawData.tags.map((t) => {
      const label = resolveLocalized(t.label, lang)
      tagMap[t.id] = label
      return { id: t.id, label }
    })

    return {
      tags,
      scales: rawData.scales.map((s) => ({
        ...s,
        name: resolveLocalized(s.name, lang),
        description: resolveLocalized(s.description, lang),
        resolvedTags: s.tags.map((tid) => ({ id: tid, label: tagMap[tid] || tid })),
      })),
    }
  }

  async function loadIndex() {
    loading.value = true
    error.value = null

    try {
      if (!rawIndexCache) {
        const url = `${BASE}data/scales/_index.json`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load scale index: ${response.status}`)
        }
        rawIndexCache = await response.json()
      }

      const data = resolveIndex(rawIndexCache, locale.value)
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
    const cacheKey = `${id}_${locale.value}`
    if (scaleCache.has(cacheKey)) {
      return scaleCache.get(cacheKey)
    }

    loading.value = true
    error.value = null

    try {
      const url = `${BASE}data/scales/${id}.${locale.value}.json`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load scale "${id}": ${response.status}`)
      }
      const data = await response.json()
      scaleCache.set(cacheKey, data)
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
