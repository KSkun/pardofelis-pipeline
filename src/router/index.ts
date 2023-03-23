import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/HomePage.vue";
import Demo1 from "../pages/Demo1Page.vue";
import Demo2 from "../pages/Demo2Page.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Home },
    { path: "/demo1", component: Demo1 },
    { path: "/demo2", component: Demo2 },
  ],
});

export default router;
