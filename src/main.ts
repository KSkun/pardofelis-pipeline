import { createApp } from "vue";
import { createPinia } from "pinia";

import CanvasApp from "./CanvasApp.vue";
import router from "./router";

const app = createApp(CanvasApp);

app.use(createPinia());
app.use(router);

app.mount("#app");
