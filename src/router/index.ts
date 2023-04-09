// vue-router page config
// by chengtian.he
// 2023.1.31

import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/HomePage.vue";
import Demo from "../pages/DemoPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: Home },
    { path: "/demo/forward", component: Demo, props: { pipelineType: "forward", sceneType: "demo" } }, // forward demo
    { path: "/demo/deferred", component: Demo, props: { pipelineType: "deferred", sceneType: "demo" } }, // deferred demo
  ],
});

export default router;
