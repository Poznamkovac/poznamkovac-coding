import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../pages/HomePage.vue"),
  },
  {
    path: "/:lang(sk|en)/challenges/:pathMatch(.*)*",
    name: "challenge-dynamic-lang",
    component: () => import("../pages/ChallengeDynamicPage.vue"),
  },
  {
    path: "/challenges/:pathMatch(.*)*",
    name: "challenge-dynamic",
    component: () => import("../pages/ChallengeDynamicPage.vue"),
  },
  {
    path: "/:lang(sk|en)/embed/:pathMatch(.*)*",
    name: "embed-challenge-lang",
    component: () => import("../pages/EmbedChallengePage.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../pages/NotFoundPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
