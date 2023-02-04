<script lang="ts">
import { defineComponent } from "vue";
import PardofelisDemo from "../pardofelis/demo";

export default defineComponent({
  async mounted() {
    if (!("gpu" in navigator)) {
      console.error("WebGPU is not supported!");
      return;
    }
    const demo = new PardofelisDemo();
    await demo.initDemo();
    demo.doFrame();
  },
});
</script>

<template>
  <canvas width="512" height="512" id="target" />
</template>
