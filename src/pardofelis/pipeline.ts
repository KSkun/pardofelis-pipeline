// pipeline base class
// by chengtian.he
// 2023.4.9

import type { Scene } from "./scene/scene";
import { ModelUniformManager, SceneUniformManager } from "./uniform/pardofelis";

export abstract class PipelineBase {
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  canvasContext: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  canvasSize: [number, number];
  depthTexture: GPUTexture;

  scene: Scene;
  sceneUniform: SceneUniformManager;
  modelUniformPrototype: ModelUniformManager;
  modelUniforms: ModelUniformManager[] = [];

  isInit: boolean;
  isStopped: boolean;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
    this.isInit = false;
    this.isStopped = true;
  }

  async init() {
    await this.initDevice();
    await this.initGPUResource();
    await this.onInit();
    this.isInit = true;
  }
  
  private async initDevice() {
    let adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();
    this.canvasContext = this.canvas.getContext("webgpu");
    this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    this.canvasContext.configure({
      device: this.device,
      format: this.canvasFormat,
    });
  }

  private async initGPUResource() {
    this.modelUniformPrototype = new ModelUniformManager();
    this.modelUniformPrototype.createGPUObjects(this.device);
    this.sceneUniform = new SceneUniformManager();
    this.sceneUniform.createGPUObjects(this.device);

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.scene.createGPUObjects(this.device);
    this.scene.models.models.forEach(_ => {
      const mgr = new ModelUniformManager();
      mgr.createGPUObjects(this.device);
      this.modelUniforms.push(mgr);
    });
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);
  }

  protected abstract onInit(): Promise<void>;
  
  private async renderOneFrame() {
    if (this.isStopped) return;
    this.onRendering();
    requestAnimationFrame(() => {
      if (this.isStopped) return;
      this.renderOneFrame();
    });
  }

  protected abstract onRendering(): void;

  startRender() {
    if (!this.isInit) return;
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(() => {
      if (this.isStopped) return;
      this.renderOneFrame();
    });
  }

  stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}