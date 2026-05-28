import { ref } from 'vue'

const STORAGE_KEY = 'mindquest_queue'

function loadQueue() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
  } catch {
    return []
  }
}

function saveQueue(items) {
  try {
    uni.setStorageSync(STORAGE_KEY, items)
  } catch {}
}

const queue = ref(loadQueue())

function addToQueue(scale) {
  if (queue.value.some((s) => s.id === scale.id)) return
  const newQueue = [...queue.value, {
    id: scale.id,
    name: scale.name,
    shortName: scale.shortName,
    estimatedMinutes: scale.estimatedMinutes || 5,
  }]
  saveQueue(newQueue)
  queue.value = newQueue
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

export function useQueue() {
  return { queue, addToQueue, removeFromQueue, clearQueue, isInQueue }
}
