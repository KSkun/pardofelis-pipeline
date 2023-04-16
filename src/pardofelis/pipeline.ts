// pipeline base class
// by chengtian.he
// 2023.4.9

import { Vertex } from "./mesh/mesh";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { MVPUniformManager, MaterialUniformManager, SceneUniformManager } from "./uniform/pardofelis";

export abstract class PipelineBase {
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  canvasContext: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  canvasSize: [number, number];

  scene: Scene;
  sceneUniform: SceneUniformManager;
  mvpUniformPrototype: MVPUniformManager;
  materialUniformPrototype: MaterialUniformManager;
  modelUniforms: [MVPUniformManager, MaterialUniformManager][] = [];

  // shadow mapping
  shadowPassPipeline: GPURenderPipeline;

  isInit: boolean;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
    this.isInit = false;
  }

  async init() {
    await this.initDevice();
    await this.initGPUResource();
    await this.initShadowMapping();
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
    this.mvpUniformPrototype = new MVPUniformManager();
    this.mvpUniformPrototype.createGPUObjects(this.device);
    this.materialUniformPrototype = new MaterialUniformManager();
    this.materialUniformPrototype.createGPUObjects(this.device);
    this.sceneUniform = new SceneUniformManager();
    this.sceneUniform.createGPUObjects(this.device);

    this.scene.createGPUObjects(this.device);
    this.scene.models.models.forEach(_ => {
      const mvpMgr = new MVPUniformManager();
      mvpMgr.createGPUObjects(this.device);
      const materialMgr = new MaterialUniformManager();
      materialMgr.createGPUObjects(this.device);
      this.modelUniforms.push([mvpMgr, materialMgr]);
    });
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);
  }

  private async initShadowMapping() {
    let shadowShaderVert = new VertexShader("/shader/shadow.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await shadowShaderVert.fetchSource();
    shadowShaderVert.createGPUObjects(this.device);
    let shadowShaderFrag = new FragmentShader("/shader/shadow.frag.wgsl", []);
    await shadowShaderFrag.fetchSource();
    shadowShaderFrag.createGPUObjects(this.device);

    this.shadowPassPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.mvpUniformPrototype.bgMVP.gpuBindGroupLayout,
        ],
      }),
      vertex: shadowShaderVert.gpuVertexState,
      fragment: shadowShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
    });
  }

  protected abstract onInit(): Promise<void>;

  renderOneFrame(time: number) {
    if (!this.isInit) return;
    this.renderDepthMap();
    this.onRendering();
  }

  private renderDepthMap() {
    const commandEncoder = this.device.createCommandEncoder();
    this.scene.lights.pointLights.forEach(pl => pl.renderDepthMap(this, commandEncoder));
    this.device.queue.submit([commandEncoder.finish()]);
  }

  protected abstract onRendering(): void;
}