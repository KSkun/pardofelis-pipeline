import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Demo1 from "../pages/Demo1.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Home },
    { path: "/demo1", component: Demo1 },
  ],
});

export default router;
