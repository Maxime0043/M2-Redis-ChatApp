import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import Cookies from 'js-cookie'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'auth',
      meta: { title: 'Authentification' },
      component: AuthView,
      beforeEnter: () => {
        let connected = Cookies.get("session_id")
        if(connected != undefined) return { name: 'chat' }
      }
    },
  ]
})

export default router
