// vue-router page config
// by chengtian.he
// 2023.1.31

import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/HomePage.vue";
import ForwardDemo from "../pages/ForwardDemoPage.vue";
import DeferredDemo from "../pages/DeferredDemoPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Home },
    { path: "/demo/forward", component: ForwardDemo }, // forward demo
    { path: "/demo/deferred", component: DeferredDemo }, // deferred demo
  ],
});

export default router;
