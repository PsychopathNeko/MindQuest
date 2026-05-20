import { ref } from 'vue'

const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'mindquest_queue'

function loadQueue() {
  if (!isClient) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(items) {
  if (isClient) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const queue = ref(loadQueue())

function addToQueue(scale) {
  if (queue.value.some((s) => s.id === scale.id)) return
  queue.value.push({ id: scale.id, name: scale.name, shortName: scale.shortName, estimatedMinutes: scale.estimatedMinutes || 5 })
  saveQueue(queue.value)
}

function removeFromQueue(scaleId) {
  queue.value = queue.value.filter((s) => s.id !== scaleId)
  saveQueue(queue.value)
}

function clearQueue() {
  queue.value = []
  saveQueue(queue.value)
}

function isInQueue(scaleId) {
  return queue.value.some((s) => s.id === scaleId)
}

function updateQueueNames(scales) {
  let changed = false
  const updated = queue.value.map(item => {
    const found = scales.find(s => s.id === item.id)
    if (found && found.name !== item.name) {
      changed = true
      return { ...item, name: found.name }
    }
    return item
  })
  if (changed) {
    queue.value = updated
    saveQueue(queue.value)
  }
}

export function useQueue() {
  return { queue, addToQueue, removeFromQueue, clearQueue, isInQueue, updateQueueNames }
}
