<script lang="ts">
import { defineComponent } from "vue";
import PardofelisDemo from "../pardofelis/demo";

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
      if (this.demo != null) {
        this.demo.stopRender();
      } else {
        this.demo = new PardofelisDemo();
      }
      await this.demo.initDemo();
      this.demo.startRender();
    },
  },
});
</script>

<template>
  <canvas id="target" v-bind:width="width" v-bind:height="height" />
</template>
