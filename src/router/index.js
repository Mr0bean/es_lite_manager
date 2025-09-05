import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Search',
    component: () => import('../views/Search.vue')
  },
  {
    path: '/indices',
    name: 'Indices',
    component: () => import('../views/Indices.vue')
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/Documents.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/Stats.vue')
  },
  {
    path: '/policies',
    name: 'Policies',
    component: () => import('../views/Policies.vue')
  },
  {
    path: '/analyzers',
    name: 'Analyzers',
    component: () => import('../views/Analyzers.vue')
  },
  {
    path: '/mappings',
    name: 'Mappings',
    component: () => import('../views/Mappings.vue')
  },
  {
    path: '/connections',
    name: 'Connections',
    component: () => import('../views/Connections.vue')
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: () => import('../views/Plugins.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(), // 使用 hash 模式，兼容 Electron
  routes
})

export default router