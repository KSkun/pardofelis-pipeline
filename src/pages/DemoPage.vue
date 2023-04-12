<!--
  pipeline demo page
  by chengtian.he
  2023.1.31
-->

<script lang="ts">
import { PardofelisEditor } from "@/pardofelis/editor/editor";
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
      pipelineCanvas: null,
      editorCanvas: null,
      scene: null,
      editor: null,
      isRendering: false,
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
    document.getElementById("errorMsg").hidden = true;
    if (!("gpu" in navigator)) {
      document.getElementById("errorMsg").hidden = false;
      document.getElementById("loading").hidden = true;
      console.error("WebGPU is not supported!");
      return;
    }
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    document.getElementById("loading").hidden = false;
    this.pipelineCanvas = document.getElementById("pipelineTarget") as HTMLCanvasElement;
    this.editorCanvas = document.getElementById("editorTarget") as HTMLCanvasElement;
    this.scene = await this.getScene(this.sceneType, [this.width, this.height]);
    await this.initPipeline();
    requestAnimationFrame(time => this.renderFrame(time));
  },
  methods: {
    async onResize() {
      location.reload();
    },
    async getScene(sceneType: string, size: [number, number]): Promise<Scene> {
      if (sceneType == "demo") return await getPardofelisDemoScene(size[0] / size[1]);
      return null;
    },
    getPipeline(pipelineType: string, scene: Scene): PipelineBase {
      if (pipelineType == "forward") return new PardofelisForwardPipeline(this.pipelineCanvas, scene);
      else if (pipelineType == "deferred") return new PardofelisDeferredPipeline(this.pipelineCanvas, scene);
      return null; 
    },
    async initPipeline() {
      this.pipeline = this.getPipeline(this.pipelineType, this.scene);
      await this.pipeline.init();
      this.editor = new PardofelisEditor(this.editorCanvas, this.pipeline, [this.width, this.height]);
      await this.editor.init();
      document.getElementById("loading").hidden = true;
    },
    renderFrame(time: number) {
      if (this.pipeline != null && this.pipeline.isInit) this.pipeline.renderOneFrame(time);
      if (this.editor != null && this.editor.isInit) this.editor.renderOneFrame(time);
      requestAnimationFrame(time => this.renderFrame(time));
    }
  },
});
</script>

<template>
  <h1 id="loading">Loading Assets...</h1>
  <h1 id="errorMsg">WebGPU is not supported by your browser!</h1>
  <canvas id="pipelineTarget" v-bind:width="width" v-bind:height="height" />
  <canvas id="editorTarget" v-bind:width="width" v-bind:height="height" />
</template>

<style>
#pipelineTarget, #editorTarget {
  position: absolute;
  top: 0px;
  left: 0px;
}

#editorTarget {
  background-color: rgba(0, 0, 0, 0);
}
</style>