import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import App from '@/App.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: App
  }
]

export const router = createRouter({
  history: createWebHistory('/'),
  routes
})
