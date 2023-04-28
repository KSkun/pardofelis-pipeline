// pipeline base class
// by chengtian.he
// 2023.4.9

import { Vertex } from "./mesh/mesh";
import { PardofelisPipelineConfig } from "./pipeline/config";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { ModelUniformManager, MaterialUniformManager, SceneUniformManager, ScreenUniformManager, HiZUniformManager } from "./uniform/pardofelis";

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

  // early-z
  earlyZBuffer: GPUTexture;
  earlyZPassPipeline: GPURenderPipeline;
  earlyZPassDescriptor: GPURenderPassDescriptor;

  // hi-z culling
  hiZUniform: HiZUniformManager;
  hiZBuffers: GPUTexture[];
  hiZPrePassPipeline: GPURenderPipeline;
  hiZPrePassDescriptor: GPURenderPassDescriptor;

  isInit: boolean;

  constructor(canvas: HTMLCanvasElement, scene: Scene, config?: PardofelisPipelineConfig) {
    this.canvas = canvas;
    console.log("[PipelineBase] canvas size is " + canvas.width + "x" + canvas.height + ", aspect is " + canvas.width / canvas.height);
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
    await this.onPreInit();
    await this.initConfigRefresh(false);
    await this.onInit();
    this.isInit = true;
  }

  async initConfigRefresh(modifyIsInit: boolean = true) {
    if (modifyIsInit) this.isInit = false;
    await this.initGPUResource();
    await this.initScreenPass();
    await this.initHiZCulling();
    await this.initShadowMapping();
    await this.initEarlyZPass();
    await this.onInitConfigRefresh();
    if (modifyIsInit) this.isInit = true;
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

    this.earlyZBuffer = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });
    this.sceneUniform.bgScene.getProperty("earlyZBuffer").set(this.earlyZBuffer.createView());

    this.scene.createGPUObjects(this.device);
    this.scene.models.models.forEach(_ => {
      const modelMgr = new ModelUniformManager();
      modelMgr.createGPUObjects(this.device);
      const materialMgr = new MaterialUniformManager();
      materialMgr.createGPUObjects(this.device);
      this.modelUniforms.push([modelMgr, materialMgr]);
    });
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.scene.toBindGroup(this.sceneUniform.bgSceneEarlyZ);
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
    // DEBUG ONLY
    // this.screenUniform.bgScreen.getProperty("screenSize").set([this.canvas.width, this.canvas.height]);
    // this.screenUniform.bgScreen.getProperty("debugDrawDepth").set(this.earlyZBuffer.createView());

    this.frameBufferTextures = [];
    for (let i = 0; i < 2; i++) {
      this.frameBufferTextures.push(this.device.createTexture({
        size: { width: this.canvas.width, height: this.canvas.height },
        format: this.canvasFormat,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      }));
    }

    const macro = this.config.getPredefinedMacros();
    let shaderVert = new VertexShader("/shader/screen.vert.wgsl", undefined, macro);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/screen.frag.wgsl", [{ format: this.canvasFormat }, { format: this.canvasFormat }], macro);
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

  private async initEarlyZPass() {
    if (!this.config.enableEarlyZTest) return;
    console.log("[PipelineBase] early-z test is enabled, init early-z pass");

    const macro = this.config.getPredefinedMacros();
    macro["EARLY_Z_PASS"] = "1";
    let shaderVert = new VertexShader("/shader/earlyz.vert.wgsl", [Vertex.getGPUVertexBufferLayout()], macro);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/earlyz.frag.wgsl", [], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.device);

    this.earlyZPassPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.modelUniformPrototype.bgModel.gpuBindGroupLayout,
          this.sceneUniform.bgSceneEarlyZ.gpuBindGroupLayout,
        ],
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
    });

    this.earlyZPassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.earlyZBuffer.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  private async initHiZCulling() {
    if (!this.config.enableOcclusionCulling) return;
    console.log("[PipelineBase] hi-z culling is enabled, init hi-z preparation pass and culling pipeline");

    this.hiZUniform = new HiZUniformManager();
    this.hiZUniform.createGPUObjects(this.device);

    const mipLevelNum = Math.floor(Math.log2(Math.min(this.canvas.width, this.canvas.height))) - 1;
    const curMipSize = [this.canvas.width, this.canvas.height];
    this.hiZBuffers = [];
    for (let i = 0; i < mipLevelNum; i++) {
      let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT;
      if (i == 0) usage |= GPUTextureUsage.COPY_DST;
      this.hiZBuffers.push(this.device.createTexture({
        size: { width: curMipSize[0], height: curMipSize[1] },
        format: "depth24plus",
        usage: usage,
      }));
      curMipSize[0] = Math.floor(curMipSize[0] / 2);
      curMipSize[1] = Math.floor(curMipSize[1] / 2);
    }

    const macro = this.config.getPredefinedMacros();
    let shaderVert = new VertexShader("/shader/screen.vert.wgsl", [], macro);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/hiz.frag.wgsl", [], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.device);

    this.hiZPrePassPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.hiZUniform.bgHiZ.gpuBindGroupLayout,
        ],
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "always", // just write to the depth texture
        format: "depth24plus"
      },
    });

    this.hiZPrePassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: null,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
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

  protected async onPreInit() { }

  protected async onInit() { }

  protected async onInitConfigRefresh() { }

  renderOneFrame(time: number) {
    if (!this.isInit) return;

    this.renderHiZBuffers();

    this.renderDepthMap();

    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.scene.toBindGroup(this.sceneUniform.bgSceneEarlyZ);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);

    this.renderEarlyZBuffer();

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
    // DEBUG ONLY
    // this.screenUniform.bgScreen.getProperty("screenSize").set([this.canvas.width, this.canvas.height]);
    // this.screenUniform.bgScreen.getProperty("debugDrawDepth").set(this.hiZBuffers[3].createView());
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

  private renderEarlyZBuffer() {
    if (!this.config.enableEarlyZTest) return;
    const cmdEncoder = this.device.createCommandEncoder();
    const passEncoder = cmdEncoder.beginRenderPass(this.earlyZPassDescriptor);
    passEncoder.setPipeline(this.earlyZPassPipeline);
    passEncoder.setBindGroup(1, this.sceneUniform.bgSceneEarlyZ.gpuBindGroup);

    for (let iModel = 0; iModel < this.scene.models.models.length; iModel++) {
      const info = this.scene.models.models[iModel];
      const uniformMgr = this.modelUniforms[iModel];
      for (let iMesh = 0; iMesh < info.model.meshes.length; iMesh++) {
        const instNum = info.toBindGroup(uniformMgr[0].bgModel, iMesh);
        if (instNum == 0) continue;
        const mesh = info.model.meshes[iMesh];
        uniformMgr[0].bufferMgr.writeBuffer(this.device);
        passEncoder.setBindGroup(0, uniformMgr[0].bgModel.gpuBindGroup);
        for (let iInst = 0; iInst < (this.config.enableInstance ? 1 : instNum); iInst++) {
          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          if (this.config.enableInstance) passEncoder.drawIndexed(mesh.faces.length * 3, instNum);
          else passEncoder.drawIndexed(mesh.faces.length * 3, 1, 0, 0, iInst);
        }
      }
    }

    passEncoder.end();
    this.device.queue.submit([cmdEncoder.finish()]);
  }

  private renderHiZBuffers() {
    if (!this.config.enableOcclusionCulling) return;
    const cmdEncoder = this.device.createCommandEncoder();
    cmdEncoder.copyTextureToTexture(
      { texture: this.earlyZBuffer },
      { texture: this.hiZBuffers[0] },
      [this.canvas.width, this.canvas.height]
    );
    for (let i = 1; i < this.hiZBuffers.length; i++) {
      this.hiZPrePassDescriptor.depthStencilAttachment.view = this.hiZBuffers[i].createView();
      this.hiZUniform.bgHiZ.getProperty("prevMipZBuffer").set(this.hiZBuffers[i - 1].createView());
      this.hiZUniform.bgHiZ.getProperty("curMipSize").set([this.hiZBuffers[i].width, this.hiZBuffers[i].height]);
      this.hiZUniform.bufferMgr.writeBuffer(this.device);

      const passEncoder = cmdEncoder.beginRenderPass(this.hiZPrePassDescriptor);
      passEncoder.setPipeline(this.hiZPrePassPipeline);
      passEncoder.setBindGroup(0, this.hiZUniform.bgHiZ.gpuBindGroup);
      passEncoder.draw(6);
      passEncoder.end();
    }
    this.device.queue.submit([cmdEncoder.finish()]);
  }

  protected abstract onRendering(): void;
}