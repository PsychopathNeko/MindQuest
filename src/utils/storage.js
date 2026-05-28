/**
 * Storage utility — adapted for uni-app (uni.setStorageSync/getStorageSync)
 */

const STORAGE_PREFIX = 'assessment_'

export function saveAssessment(result) {
  const key = `${STORAGE_PREFIX}${result.scaleId}_${result.timestamp}`
  try {
    uni.setStorageSync(key, result)
  } catch (err) {
    console.error('Failed to save assessment:', err)
  }
  return key
}

export function getAssessments() {
  const results = []
  try {
    const res = uni.getStorageInfoSync()
    const keys = res.keys || []
    for (const key of keys) {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const data = uni.getStorageSync(key)
          if (data) results.push({ key, data })
        } catch {}
      }
    }
  } catch (err) {
    console.error('Failed to get assessments:', err)
  }
  results.sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0))
  return results
}

export function getAssessment(key) {
  try {
    return uni.getStorageSync(key) || null
  } catch {
    return null
  }
}

export function deleteAssessment(key) {
  try {
    uni.removeStorageSync(key)
  } catch {}
}

export function getAssessmentsForScale(scaleId) {
  return getAssessments()
    .filter((item) => item.data.scaleId === scaleId)
    .sort((a, b) => (a.data.timestamp || 0) - (b.data.timestamp || 0))
}

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

export function importData(jsonStr) {
  const result = { imported: 0, skipped: 0, errors: 0 }
  let payload
  try {
    payload = JSON.parse(jsonStr)
  } catch {
    throw new Error('Invalid JSON format')
  }
  if (!payload.assessments || !Array.isArray(payload.assessments)) {
    throw new Error('Invalid data format: missing assessments array')
  }
  const existing = new Set(getAssessments().map(a => `${a.data.scaleId}_${a.data.timestamp}`))
  for (const item of payload.assessments) {
    if (!item.scaleId || !item.timestamp) { result.errors++; continue }
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

const DRAFT_PREFIX = 'mindquest_draft_'
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function saveDraft(scaleId, data) {
  const key = DRAFT_PREFIX + scaleId
  try {
    uni.setStorageSync(key, {
      answers: data.answers,
      currentIndex: data.currentIndex,
      questionCount: data.questionCount,
      savedAt: Date.now(),
    })
  } catch (err) {
    console.error('Failed to save draft:', err)
  }
}

export function getDraft(scaleId) {
  const key = DRAFT_PREFIX + scaleId
  try {
    const data = uni.getStorageSync(key)
    if (!data) return null
    if (Date.now() - data.savedAt > DRAFT_EXPIRY_MS) {
      uni.removeStorageSync(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearDraft(scaleId) {
  const key = DRAFT_PREFIX + scaleId
  try {
    uni.removeStorageSync(key)
  } catch {}
}
