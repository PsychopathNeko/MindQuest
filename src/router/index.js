import NotFoundView from '@/views/NotFoundView.vue'

export const routes = [
  {
    path: '/:lang(en)?',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/:lang(en)?/scale/:id',
    name: 'scale-detail',
    component: () => import('@/views/ScaleDetailView.vue'),
  },
  {
    path: '/:lang(en)?/assessment/:id',
    name: 'assessment',
    component: () => import('@/views/AssessmentView.vue'),
  },
  {
    path: '/:lang(en)?/report/:id',
    name: 'report',
    component: () => import('@/views/ReportView.vue'),
  },
  {
    path: '/:lang(en)?/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
  },
  {
    path: '/:lang(en)?/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
]
