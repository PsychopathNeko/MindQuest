import { ref } from 'vue'
import { getAssessments, deleteAssessment } from '../utils/storage'
import { useLocale } from './useLocale'

const STORAGE_PREFIX = 'assessment_'

export function useHistory() {
  const { locale } = useLocale()
  const records = ref([])
  const loading = ref(false)

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

  function removeRecord(key) {
    deleteAssessment(key)
    loadRecords()
  }

  function clearAll() {
    try {
      const res = uni.getStorageInfoSync()
      const keys = res.keys || []
      for (const key of keys) {
        if (key.startsWith(STORAGE_PREFIX)) {
          uni.removeStorageSync(key)
        }
      }
    } catch {}
    records.value = []
  }

  function formatDate(timestamp) {
    if (!timestamp) return ''
    const d = new Date(timestamp)
    if (locale.value === 'en') {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${hours}:${minutes}`
    }
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
