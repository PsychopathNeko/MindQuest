import { ref } from 'vue'
import { useLocale } from './useLocale'
import { getScale as getScaleA } from '../scales-data-a/data.js'
import { getScale as getScaleB } from '../scales-data-b/data.js'
import { getScale as getScaleC } from '../scales-data-c/data.js'
import indexData from '../static/scales/_index.json'

// Module-level cache
let rawIndexCache = null
const scaleCache = new Map()

function resolveLocalized(val, lang) {
  if (val && typeof val === 'object' && (val.zh || val.en)) {
    return val[lang] || val.zh || ''
  }
  return val || ''
}

/**
 * Determine which subpackage loader to use for a scale ID.
 * a-g -> A, h-p -> B, q-z -> C
 */
function getScaleFromSubpackage(scaleId, lang) {
  const key = `${scaleId}.${lang}`
  const first = scaleId.charAt(0).toLowerCase()
  if (first >= 'a' && first <= 'g') return getScaleA(key)
  if (first >= 'h' && first <= 'p') return getScaleB(key)
  return getScaleC(key)
}

export function useScaleLoader() {
  const { locale } = useLocale()
  const index = ref(null)
  const scales = ref([])
  const tags = ref([])
  const tagGroups = ref([])
  const loading = ref(false)
  const error = ref(null)

  function resolveIndex(rawData, lang) {
    const tagMap = {}
    const resolvedTags = rawData.tags.map((t) => {
      const label = resolveLocalized(t.label, lang)
      tagMap[t.id] = label
      return { id: t.id, label }
    })
    const groups = (rawData.tagGroups || []).map((g) => ({
      id: g.id,
      label: resolveLocalized(g.label, lang),
      tags: g.tags.map((tid) => ({ id: tid, label: tagMap[tid] || tid })),
    }))
    return {
      tags: resolvedTags,
      tagGroups: groups,
      scales: rawData.scales.map((s) => ({
        ...s,
        name: resolveLocalized(s.name, lang),
        description: resolveLocalized(s.description, lang),
        resolvedTags: s.tags.map((tid) => ({ id: tid, label: tagMap[tid] || tid })),
      })),
    }
  }

  function loadIndex() {
    loading.value = true
    error.value = null

    try {
      if (!rawIndexCache) {
        rawIndexCache = indexData
      }

      const data = resolveIndex(rawIndexCache, locale.value)
      index.value = data
      scales.value = data.scales
      tags.value = data.tags
      tagGroups.value = data.tagGroups
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to load scale index:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function loadScale(id) {
    const lang = locale.value
    const cacheKey = `${id}_${lang}`
    if (scaleCache.has(cacheKey)) {
      return scaleCache.get(cacheKey)
    }

    loading.value = true
    error.value = null

    try {
      const data = getScaleFromSubpackage(id, lang)
      if (data) {
        scaleCache.set(cacheKey, data)
      }
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
    tagGroups,
    loading,
    error,
    loadIndex,
    loadScale,
  }
}
