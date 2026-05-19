const STORAGE_PREFIX = 'assessment_'

/**
 * Save an assessment result to localStorage.
 *
 * @param {Object} result — { scaleId, scaleName, timestamp, answers, scores, report }
 * @returns {string} — the storage key
 */
export function saveAssessment(result) {
  const key = `${STORAGE_PREFIX}${result.scaleId}_${result.timestamp}`
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
  localStorage.removeItem(key)
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
