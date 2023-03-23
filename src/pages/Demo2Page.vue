<script lang="ts">
import { defineComponent } from "vue";
import PardofelisDemoDeferred from "../pardofelis/demo_deferred";

export default defineComponent({
  data() {
    return {
      demo: null,
      width: 800,
      height: 600,
    };
  },
  created() {
    window.addEventListener("resize", this.onResize);
  },
  unmounted() {
    window.removeEventListener("resize", this.onResize);
  },
  async mounted() {
    await this.onResize();
  },
  methods: {
    async onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      await this.initDemo();
    },
    async initDemo() {
      if (!("gpu" in navigator)) {
        console.error("WebGPU is not supported!");
        return;
      }
      document.getElementById("loading").hidden = false;
      if (this.demo != null) {
        this.demo.stopRender();
      }
      this.demo = new PardofelisDemoDeferred();
      await this.demo.initDemo();
      document.getElementById("loading").hidden = true;
      this.demo.startRender();
    },
  },
});
</script>

<template>
  <h1 id="loading">Loading Assets...</h1>
  <canvas id="target" v-bind:width="width" v-bind:height="height" />
</template>
