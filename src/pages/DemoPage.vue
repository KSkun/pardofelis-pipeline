<!--
  forward demo page
  by chengtian.he
  2023.1.31
-->

<script lang="ts">
import type { PipelineBase } from "@/pardofelis/pipeline";
import { PardofelisDeferredPipeline } from "@/pardofelis/pipeline_deferred";
import { PardofelisForwardPipeline } from "@/pardofelis/pipeline_forward";
import { getPardofelisDemoScene } from "@/pardofelis/scene/pardofelis";
import type { Scene } from "@/pardofelis/scene/scene";
import { defineComponent } from "vue";

export default defineComponent({
  props: ["pipelineType", "sceneType"],
  data() {
    return {
      pipeline: null,
      canvas: null,
      scene: null,
      width: 800,
      height: 600,
    };
  },
  created() {
    if (!("gpu" in navigator)) return;
    window.addEventListener("resize", this.onResize);
  },
  unmounted() {
    if (!("gpu" in navigator)) return;
    window.removeEventListener("resize", this.onResize);
  },
  async mounted() {
    document.getElementById("errorMsg").hidden = true;
    if (!("gpu" in navigator)) {
      document.getElementById("errorMsg").hidden = false;
      document.getElementById("loading").hidden = true;
      console.error("WebGPU is not supported!");
      return;
    }
    document.getElementById("loading").hidden = false;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas = document.getElementById("target") as HTMLCanvasElement;
    this.scene = await this.getScene(this.sceneType, [this.width, this.height]);
    await this.initPipeline();
  },
  methods: {
    async onResize() {
      document.getElementById("loading").hidden = false;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      await this.initPipeline();
    },
    async getScene(sceneType: string, size: [number, number]): Promise<Scene> {
      if (sceneType == "demo") return await getPardofelisDemoScene(size[0] / size[1]);
      return null;
    },
    getPipeline(pipelineType: string, scene: Scene): PipelineBase {
      if (pipelineType == "forward") return new PardofelisForwardPipeline(this.canvas, scene);
      else if (pipelineType == "deferred") return new PardofelisDeferredPipeline(this.canvas, scene);
      return null;
    },
    async initPipeline() {
      if (this.pipeline != null) {
        this.pipeline.stopRender();
      }
      this.pipeline = this.getPipeline(this.pipelineType, this.scene);
      await this.pipeline.init();
      document.getElementById("loading").hidden = true;
      this.pipeline.startRender();
    },
  },
});
</script>

<template>
  <h1 id="loading">Loading Assets...</h1>
  <h1 id="errorMsg">WebGPU is not supported by your browser!</h1>
  <canvas id="target" v-bind:width="width" v-bind:height="height" />
</template>
