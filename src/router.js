import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const routes = [
  { path: "/", name: "home", component: () => import("@/views/VistaInicio.vue") },
  { path: "/acceso", name: "login", component: () => import("@/views/VistaAcceso.vue") },
  {
    path: "/app",
    component: () => import("@/views/app/MarcoApp.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: { name: "map" } },
      { path: "mapa", name: "map", component: () => import("@/views/app/VistaMapa.vue") },
      { path: "lugar", name: "place", component: () => import("@/views/app/VistaLugar.vue") },
      { path: "comida", name: "food", component: () => import("@/views/app/VistaComida.vue") },
      { path: "perfil", name: "profile", component: () => import("@/views/app/VistaPerfil.vue") },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: "smooth", top: 24 };
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const { user } = useAuth();
  if (to.meta.requiresAuth && !user.value) {
    return { name: "login", query: { next: to.fullPath } };
  }
});

export default router;
