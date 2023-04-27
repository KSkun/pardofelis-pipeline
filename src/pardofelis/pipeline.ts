// pipeline base class
// by chengtian.he
// 2023.4.9

import { Vertex } from "./mesh/mesh";
import { PardofelisPipelineConfig } from "./pipeline/config";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { ModelUniformManager, MaterialUniformManager, SceneUniformManager, ScreenUniformManager } from "./uniform/pardofelis";

export abstract class PipelineBase {
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  canvasContext: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  frameBufferTextures: GPUTexture[];
  currentFBIndex: number = 0;

  config: PardofelisPipelineConfig;
  scene: Scene;
  sceneUniform: SceneUniformManager;
  modelUniformPrototype: ModelUniformManager;
  materialUniformPrototype: MaterialUniformManager;
  modelUniforms: [ModelUniformManager, MaterialUniformManager][] = [];
  screenUniform: ScreenUniformManager;

  // shadow mapping
  shadowPassPipeline: GPURenderPipeline;

  // framebuffer to screen
  screenPassPipeline: GPURenderPipeline;
  screenPassDescriptor: GPURenderPassDescriptor;

  isInit: boolean;

  constructor(canvas: HTMLCanvasElement, scene: Scene, config?: PardofelisPipelineConfig) {
    this.canvas = canvas;
    this.scene = scene;
    this.config = config;
    if (config == undefined) this.config = new PardofelisPipelineConfig();
    this.isInit = false;
  }

  getAspect() {
    return this.canvas.width / this.canvas.height;
  }

  async init() {
    if (this.config.enableStaticBatching) {
      const batchedNum = this.scene.models.batchMeshes();
      console.log("[PipelineBase] static batching is enabled, batched " + batchedNum + " instances");
    }
    await this.initDevice();
    await this.initScreenPass();
    await this.onInit();
    await this.initConfigRefresh();
    this.isInit = true;
  }

  async initConfigRefresh() {
    this.isInit = false;
    await this.initGPUResource();
    await this.initShadowMapping();
    await this.onInitConfigRefresh();
    this.isInit = true;
  }

  private async initDevice() {
    console.log("[PipelineBase] init device");
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
    console.log("[PipelineBase] init GPU resource");
    this.modelUniformPrototype = new ModelUniformManager();
    this.modelUniformPrototype.createGPUObjects(this.device);
    this.materialUniformPrototype = new MaterialUniformManager();
    this.materialUniformPrototype.createGPUObjects(this.device);
    this.sceneUniform = new SceneUniformManager();
    this.sceneUniform.createGPUObjects(this.device);

    this.scene.createGPUObjects(this.device);
    this.scene.models.models.forEach(_ => {
      const modelMgr = new ModelUniformManager();
      modelMgr.createGPUObjects(this.device);
      const materialMgr = new MaterialUniformManager();
      materialMgr.createGPUObjects(this.device);
      this.modelUniforms.push([modelMgr, materialMgr]);
    });
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);
  }

  private async initShadowMapping() {
    if (!this.config.enableShadowMapping) return;
    console.log("[PipelineBase] shadow is enabled, init shadow pass");
    const macro = this.config.getPredefinedMacros();
    let shadowShaderVert = new VertexShader("/shader/shadow.vert.wgsl", [Vertex.getGPUVertexBufferLayout()], macro);
    await shadowShaderVert.fetchSource();
    shadowShaderVert.createGPUObjects(this.device);
    let shadowShaderFrag = new FragmentShader("/shader/shadow.frag.wgsl", [{ format: "r32float" }], macro);
    await shadowShaderFrag.fetchSource();
    shadowShaderFrag.createGPUObjects(this.device);

    this.shadowPassPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.modelUniformPrototype.bgModel.gpuBindGroupLayout,
          this.sceneUniform.bgScene.gpuBindGroupLayout,
        ],
      }),
      vertex: shadowShaderVert.gpuVertexState,
      fragment: shadowShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "back"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
    });
  }

  private async initScreenPass() {
    console.log("[PipelineBase] init screen pass");
    this.screenUniform = new ScreenUniformManager();
    this.screenUniform.createGPUObjects(this.device);

    this.frameBufferTextures = [];
    for (let i = 0; i < 2; i++) {
      this.frameBufferTextures.push(this.device.createTexture({
        size: { width: this.canvas.width, height: this.canvas.height },
        format: this.canvasFormat,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      }));
    }

    let shaderVert = new VertexShader("/shader/screen.vert.wgsl", undefined);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/screen.frag.wgsl", [{ format: this.canvasFormat }, { format: this.canvasFormat }]);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.device);

    this.screenPassPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.screenUniform.bgScreen.gpuBindGroupLayout,
        ],
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
    });

    this.screenPassDescriptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ]
    };
  }

  switchFrameBuffer() {
    if (this.currentFBIndex == 0) this.currentFBIndex = 1;
    else this.currentFBIndex = 0;
  }

  getCurFrameBuffer() {
    return this.frameBufferTextures[this.currentFBIndex];
  }

  getPrevFrameBuffer() {
    const prevIndex = this.currentFBIndex == 0 ? 1 : 0;
    return this.frameBufferTextures[prevIndex];
  }

  protected async onInit() { }

  protected async onInitConfigRefresh() { }

  renderOneFrame(time: number) {
    if (!this.isInit) return;

    this.renderDepthMap();
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);

    this.onRendering();

    this.renderFBToScreen();
    this.switchFrameBuffer();
  }

  private renderDepthMap() {
    if (!this.config.enableShadowMapping) return;
    this.scene.lights.pointLights.forEach(pl => pl.renderDepthMap(this));
    this.scene.lights.dirLights.forEach(dl => dl.renderDepthMap(this));
  }

  private renderFBToScreen() {
    this.screenUniform.bgScreen.getProperty("screenFrameBuffer").set(this.getCurFrameBuffer().createView());
    this.screenUniform.bufferMgr.writeBuffer(this.device);

    const cmdEncoder = this.device.createCommandEncoder();
    this.screenPassDescriptor.colorAttachments[0].view = this.canvasContext.getCurrentTexture().createView();
    this.screenPassDescriptor.colorAttachments[1].view = this.getPrevFrameBuffer().createView();
    const passEncoder = cmdEncoder.beginRenderPass(this.screenPassDescriptor);
    passEncoder.setPipeline(this.screenPassPipeline);
    passEncoder.setBindGroup(0, this.screenUniform.bgScreen.gpuBindGroup);
    passEncoder.draw(6);
    passEncoder.end();
    this.device.queue.submit([cmdEncoder.finish()]);
  }

  protected abstract onRendering(): void;
}