import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Locale-aware router wrapper.
 * Automatically includes the current lang param in all navigation calls
 * so links preserve the user's language context.
 */
export function useLocalizedRouter() {
  const route = useRoute()
  const router = useRouter()

  const currentLang = computed(() => route.params.lang || undefined)

  function push(options) {
    if (typeof options === 'object' && options.name) {
      const params = { ...options.params }
      if (currentLang.value) params.lang = currentLang.value
      return router.push({ ...options, params })
    }
    return router.push(options)
  }

  function resolve(options) {
    if (typeof options === 'object' && options.name) {
      const params = { ...options.params }
      if (currentLang.value) params.lang = currentLang.value
      return router.resolve({ ...options, params })
    }
    return router.resolve(options)
  }

  /** Get the path for the same page in the alternate language */
  function alternatePath() {
    const newLang = currentLang.value === 'en' ? undefined : 'en'
    const params = { ...route.params }
    if (newLang) {
      params.lang = newLang
    } else {
      delete params.lang
    }
    return router.resolve({ name: route.name, params, query: route.query }).href
  }

  return { push, resolve, currentLang, alternatePath }
}
