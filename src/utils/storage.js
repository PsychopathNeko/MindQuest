const isClient = typeof window !== 'undefined'
export const STORAGE_PREFIX = 'assessment_'

/**
 * Save an assessment result to localStorage.
 *
 * @param {Object} result — { scaleId, scaleName, timestamp, answers, scores, report }
 * @returns {string} — the storage key
 */
export function saveAssessment(result) {
  const key = `${STORAGE_PREFIX}${result.scaleId}_${result.timestamp}`
  if (!isClient) return key
  try {
    localStorage.setItem(key, JSON.stringify(result))
  } catch (err) {
    console.error('Failed to save assessment:', err)
  }
  return key
}

/**
 * Get all saved assessments, sorted by date descending (newest first).
 *
 * @returns {Array<{ key: string, data: Object }>}
 */
export function getAssessments() {
  if (!isClient) return []
  const results = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        results.push({ key, data })
      } catch {
        // skip corrupted entries
      }
    }
  }
  results.sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0))
  return results
}

/**
 * Get a single assessment by its storage key.
 *
 * @param {string} key
 * @returns {Object|null}
 */
export function getAssessment(key) {
  if (!isClient) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Delete a single assessment by its storage key.
 *
 * @param {string} key
 */
export function deleteAssessment(key) {
  if (isClient) localStorage.removeItem(key)
}


/**
 * Get all assessments for a specific scale, sorted by timestamp ascending (oldest first).
 *
 * @param {string} scaleId
 * @returns {Array<{ key: string, data: Object }>}
 */
export function getAssessmentsForScale(scaleId) {
  return getAssessments()
    .filter((item) => item.data.scaleId === scaleId)
    .sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0))
}


/**
 * Export all assessment data as a JSON string.
 * @returns {string}
 */
export function exportAllData() {
  const assessments = getAssessments()
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'MindQuest',
    assessments: assessments.map(a => a.data)
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Import assessment data from a JSON string.
 * Merges with existing data (skips duplicates by scaleId+timestamp).
 * @param {string} jsonStr
 * @returns {{ imported: number, skipped: number, errors: number }}
 */
export function importData(jsonStr) {
  const result = { imported: 0, skipped: 0, errors: 0 }

  // Size check: reject files over 10MB
  if (jsonStr.length > 10 * 1024 * 1024) {
    throw new Error('File too large (max 10MB)')
  }

  let payload
  try {
    payload = JSON.parse(jsonStr)
  } catch {
    throw new Error('Invalid JSON format')
  }
  if (!payload.assessments || !Array.isArray(payload.assessments)) {
    throw new Error('Invalid data format: missing assessments array')
  }

  // Version check
  if (payload.version && payload.version > 1) {
    throw new Error('Unsupported data version')
  }

  // Count check: limit to 10000 assessments
  if (payload.assessments.length > 10000) {
    throw new Error('Too many assessments (max 10000)')
  }

  const existing = new Set(getAssessments().map(a => `${a.data.scaleId}_${a.data.timestamp}`))
  for (const item of payload.assessments) {
    if (!item.scaleId || !item.timestamp || typeof item.answers !== 'object' || typeof item.scores !== 'object') { result.errors++; continue }
    const id = `${item.scaleId}_${item.timestamp}`
    if (existing.has(id)) { result.skipped++; continue }
    try {
      saveAssessment(item)
      result.imported++
    } catch {
      result.errors++
    }
  }
  return result
}
