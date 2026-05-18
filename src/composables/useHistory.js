import { ref } from 'vue'
import { getAssessments, deleteAssessment } from '@/utils/storage'

const STORAGE_PREFIX = 'assessment_'

/**
 * Composable for managing assessment history records.
 */
export function useHistory() {
  const records = ref([])
  const loading = ref(false)

  /**
   * Load all assessment records from localStorage, newest first.
   */
  function loadRecords() {
    loading.value = true
    try {
      records.value = getAssessments()
    } catch (err) {
      console.error('Failed to load history records:', err)
      records.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a single assessment record by storage key.
   *
   * @param {string} key
   */
  function removeRecord(key) {
    deleteAssessment(key)
    loadRecords()
  }

  /**
   * Clear all assessment records from localStorage.
   */
  function clearAll() {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
    records.value = []
  }

  /**
   * Format a timestamp into a human-readable Chinese date string.
   *
   * @param {number} timestamp
   * @returns {string}
   */
  function formatDate(timestamp) {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}年${month}月${day}日 ${hours}:${minutes}`
  }

  return {
    records,
    loading,
    loadRecords,
    removeRecord,
    clearAll,
    formatDate,
  }
}
