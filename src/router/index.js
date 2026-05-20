import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/scale/:id',
      name: 'scale-detail',
      component: () => import('@/views/ScaleDetailView.vue'),
    },
    {
      path: '/assessment/:id',
      name: 'assessment',
      component: () => import('@/views/AssessmentView.vue'),
    },
    {
      path: '/report/:id',
      name: 'report',
      component: () => import('@/views/ReportView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  if (['scale-detail', 'assessment', 'report'].includes(to.name)) {
    if (!to.params.id || to.params.id.trim() === '') {
      next({ name: 'home' })
      return
    }
  }
  next()
})

export default router
