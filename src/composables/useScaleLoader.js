import { ref, computed } from 'vue'
import { useLocale } from './useLocale'

const isClient = typeof window !== 'undefined'
// Module-level caches: shared across all SSG route renders to avoid re-reading the same files 159 times
let rawIndexCache = null
const scaleCache = new Map()

const BASE = import.meta.env.BASE_URL

function resolveLocalized(val, lang) {
  if (val && typeof val === 'object' && (val.zh || val.en)) {
    return val[lang] || val.zh || ''
  }
  return val || ''
}

async function fetchJson(relativePath) {
  if (isClient) {
    const response = await fetch(`${BASE}${relativePath}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
  // SSG: read from local filesystem, anchored to source file location (not CWD)
  const { readFileSync } = await import(/* @vite-ignore */ 'node:fs')
  const { fileURLToPath } = await import(/* @vite-ignore */ 'node:url')
  const absPath = fileURLToPath(new URL(`../../public/${relativePath}`, import.meta.url))
  return JSON.parse(readFileSync(absPath, 'utf-8'))
}

export function useScaleLoader() {
  const { locale } = useLocale()
  const index = ref(null)
  const scales = ref([])
  const tags = ref([])
  const tagGroups = ref([])
  const _loadCount = ref(0)
  const loading = computed(() => _loadCount.value > 0)
  const error = ref(null)

  function resolveIndex(rawData, lang) {
    const tagMap = {}
    const tags = rawData.tags.map((t) => {
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
      tags,
      tagGroups: groups,
      scales: rawData.scales.map((s) => ({
        ...s,
        name: resolveLocalized(s.name, lang),
        description: resolveLocalized(s.description, lang),
        resolvedTags: s.tags.map((tid) => ({ id: tid, label: tagMap[tid] || tid })),
      })),
    }
  }

  async function loadIndex() {
    _loadCount.value++
    error.value = null

    try {
      if (!rawIndexCache) {
        rawIndexCache = await fetchJson('data/scales/_index.json')
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
      _loadCount.value--
    }
  }

  async function loadScale(id) {
    const cacheKey = `${id}_${locale.value}`
    if (scaleCache.has(cacheKey)) {
      return scaleCache.get(cacheKey)
    }

    _loadCount.value++
    error.value = null

    try {
      const data = await fetchJson(`data/scales/${id}.${locale.value}.json`)
      scaleCache.set(cacheKey, data)
      return data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to load scale "${id}":`, err)
      return null
    } finally {
      _loadCount.value--
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
