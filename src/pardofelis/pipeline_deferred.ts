// deferred pipeline
// by chengtian.he
// 2023.4.9

import _ from "lodash";

import { Vertex } from "./mesh/mesh";
import { DeferredUniformManager, DirLightUniformManager, PointLightUniformManager } from "./uniform/pardofelis";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { GBuffers } from "./pipeline/gbuffer";
import { PipelineBase } from "./pipeline";
import { PardofelisPipelineConfig } from "./pipeline/config";

class DeferredPointLightPass {
  pipeline: PardofelisDeferredPipeline;
  lightUniform: PointLightUniformManager;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisDeferredPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    this.lightUniform = new PointLightUniformManager();
    this.lightUniform.createGPUObjects(this.pipeline.device);

    const macro = this.pipeline.config.getPredefinedMacros();
    macro["POINT_LIGHT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/deferred_light.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.deferredUniform.bgGBuffer.gpuBindGroupLayout,
          this.lightUniform.bgLight.gpuBindGroupLayout,
        ]
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
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

    this.gpuPassDesciptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.pipeline.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  renderLightPass() {
    for (let iLight = 0; iLight < this.pipeline.scene.lights.pointLights.length; iLight++) {
      this.pipeline.switchFrameBuffer();

      const light = this.pipeline.scene.lights.pointLights[iLight];
      light.toBindGroup(this.lightUniform.bgLight);
      this.lightUniform.bgLight.getProperty("screenFrameBuffer").set(this.pipeline.getPrevFrameBuffer().createView());
      this.lightUniform.bufferMgr.writeBuffer(this.pipeline.device);

      const cmdEncoder = this.pipeline.device.createCommandEncoder();
      this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();
      const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
      passEncoder.setPipeline(this.gpuPipeline);

      passEncoder.setBindGroup(0, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
      passEncoder.setBindGroup(1, this.pipeline.deferredUniform.bgGBuffer.gpuBindGroup);
      passEncoder.setBindGroup(2, this.lightUniform.bgLight.gpuBindGroup);
      passEncoder.draw(6);

      passEncoder.end();
      this.pipeline.device.queue.submit([cmdEncoder.finish()]);
    }
  }
}

class DeferredDirLightPass {
  pipeline: PardofelisDeferredPipeline;
  lightUniform: DirLightUniformManager;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisDeferredPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    this.lightUniform = new DirLightUniformManager();
    this.lightUniform.createGPUObjects(this.pipeline.device);

    const macro = this.pipeline.config.getPredefinedMacros();
    macro["DIR_LIGHT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/deferred_light.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.deferredUniform.bgGBuffer.gpuBindGroupLayout,
          this.lightUniform.bgLight.gpuBindGroupLayout,
        ]
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
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

    this.gpuPassDesciptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.pipeline.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  renderLightPass() {
    for (let iLight = 0; iLight < this.pipeline.scene.lights.dirLights.length; iLight++) {
      this.pipeline.switchFrameBuffer();

      const light = this.pipeline.scene.lights.dirLights[iLight];
      light.toBindGroup(this.lightUniform.bgLight);
      this.lightUniform.bgLight.getProperty("screenFrameBuffer").set(this.pipeline.getPrevFrameBuffer().createView());
      this.lightUniform.bufferMgr.writeBuffer(this.pipeline.device);

      const cmdEncoder = this.pipeline.device.createCommandEncoder();
      this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();
      const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
      passEncoder.setPipeline(this.gpuPipeline);

      passEncoder.setBindGroup(0, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
      passEncoder.setBindGroup(1, this.pipeline.deferredUniform.bgGBuffer.gpuBindGroup);
      passEncoder.setBindGroup(2, this.lightUniform.bgLight.gpuBindGroup);
      passEncoder.draw(6);

      passEncoder.end();
      this.pipeline.device.queue.submit([cmdEncoder.finish()]);
    }
  }
}

class DeferredAmbientPass {
  pipeline: PardofelisDeferredPipeline;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisDeferredPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    const macro = this.pipeline.config.getPredefinedMacros();
    macro["AMBIENT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/deferred_light.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.deferredUniform.bgGBuffer.gpuBindGroupLayout,
          this.pipeline.screenUniform.bgScreen.gpuBindGroupLayout,
        ]
      }),
      vertex: shaderVert.gpuVertexState,
      fragment: shaderFrag.gpuFragmentState,
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

    this.gpuPassDesciptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.pipeline.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  renderLightPass() {
    this.pipeline.switchFrameBuffer();

    this.pipeline.screenUniform.bgScreen.getProperty("screenFrameBuffer").set(this.pipeline.getPrevFrameBuffer().createView());
    this.pipeline.screenUniform.bufferMgr.writeBuffer(this.pipeline.device);

    const cmdEncoder = this.pipeline.device.createCommandEncoder();
    this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();
    const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
    passEncoder.setPipeline(this.gpuPipeline);

    passEncoder.setBindGroup(0, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
    passEncoder.setBindGroup(1, this.pipeline.deferredUniform.bgGBuffer.gpuBindGroup);
    passEncoder.setBindGroup(2, this.pipeline.screenUniform.bgScreen.gpuBindGroup);
    passEncoder.draw(6);

    passEncoder.end();
    this.pipeline.device.queue.submit([cmdEncoder.finish()]);
  }
}

export class PardofelisDeferredPipeline extends PipelineBase {
  gBuffers: GBuffers;
  depthTexture: GPUTexture;
  basePassDesciptors: GPURenderPassDescriptor[] = [];
  basePassPipelines: GPURenderPipeline[] = [];
  pointLightPass: DeferredPointLightPass;
  dirLightPass: DeferredDirLightPass;
  ambientPass: DeferredAmbientPass;

  deferredUniform: DeferredUniformManager;

  constructor(canvas: HTMLCanvasElement, scene: Scene, config?: PardofelisPipelineConfig) {
    super(canvas, scene, config);
  }

  protected async onInit() {
    await this.initGBuffer();
  }

  protected async onInitConfigRefresh() {
    await this.initBasePassPipeline();
    await this.initLightPassPipeline();
  }

  private async initGBuffer() {
    this.deferredUniform = new DeferredUniformManager();
    this.deferredUniform.createGPUObjects(this.device);
    this.gBuffers = GBuffers.create(this.device, [this.canvas.width, this.canvas.height]);
    this.gBuffers.toBindGroup(this.deferredUniform.bgGBuffer);
    this.deferredUniform.bufferMgr.writeBuffer(this.device);
  }

  private async initBasePassPipeline() {
    const macro = this.config.getPredefinedMacros();
    let basePassShaderVert = new VertexShader("/shader/common.vert.wgsl", [Vertex.getGPUVertexBufferLayout()], macro);
    await basePassShaderVert.fetchSource();
    basePassShaderVert.createGPUObjects(this.device);

    const colorTargetStates = GBuffers.getGPUColorTargetStates();

    // base pass 1

    let basePass1ShaderFrag = new FragmentShader("/shader/deferred_base1.frag.wgsl", colorTargetStates[0], macro);
    await basePass1ShaderFrag.fetchSource();
    basePass1ShaderFrag.createGPUObjects(this.device);

    this.basePassPipelines.push(this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.mvpUniformPrototype.bgMVP.gpuBindGroupLayout,
          this.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
        ],
      }),
      vertex: basePassShaderVert.gpuVertexState,
      fragment: basePass1ShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
    }));

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.basePassDesciptors.push({
      colorAttachments: [
        {
          view: this.gBuffers.worldPosView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: this.gBuffers.normalView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    // base pass 2

    let basePass2ShaderFrag = new FragmentShader("/shader/deferred_base2.frag.wgsl", colorTargetStates[1], macro);
    await basePass2ShaderFrag.fetchSource();
    basePass2ShaderFrag.createGPUObjects(this.device);

    this.basePassPipelines.push(this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.mvpUniformPrototype.bgMVP.gpuBindGroupLayout,
          this.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
        ],
      }),
      vertex: basePassShaderVert.gpuVertexState,
      fragment: basePass2ShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      }
    }));

    this.basePassDesciptors.push({
      colorAttachments: [
        {
          view: this.gBuffers.albedoView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: this.gBuffers.rmaoView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });
  }

  private async initLightPassPipeline() {
    const macro = this.config.getPredefinedMacros();

    const shaderVert = new VertexShader("/shader/screen.vert.wgsl", undefined, macro);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);

    this.pointLightPass = new DeferredPointLightPass(this);
    await this.pointLightPass.initPipeline(shaderVert);
    this.dirLightPass = new DeferredDirLightPass(this);
    await this.dirLightPass.initPipeline(shaderVert);
    this.ambientPass = new DeferredAmbientPass(this);
    await this.ambientPass.initPipeline(shaderVert);
  }

  protected onRendering() {
    // base pass
    for (let basePassIdx = 0; basePassIdx < this.basePassPipelines.length; basePassIdx++) {
      let commandEncoder = this.device.createCommandEncoder();
      let renderPassDescriptor = this.basePassDesciptors[basePassIdx];
      let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(this.basePassPipelines[basePassIdx]);

      for (let i = 0; i < this.scene.models.models.length; i++) {
        const info = this.scene.models.models[i];
        const modelMatrix = info.getModelMatrix();
        info.model.meshes.forEach(mesh => {
          const uniformMgr = this.modelUniforms[i];
          this.scene.camera.toMVPBindGroup(uniformMgr[0].bgMVP, modelMatrix);
          mesh.material.toBindGroup(uniformMgr[1].bgMaterial, this.device);
          uniformMgr[0].bufferMgr.writeBuffer(this.device);
          uniformMgr[1].bufferMgr.writeBuffer(this.device);

          passEncoder.setBindGroup(0, uniformMgr[0].bgMVP.gpuBindGroup);
          passEncoder.setBindGroup(1, uniformMgr[1].bgMaterial.gpuBindGroup);
          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          passEncoder.drawIndexed(mesh.faces.length * 3);
        });
      }

      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // light pass
    this.pointLightPass.renderLightPass();
    this.dirLightPass.renderLightPass();
    this.ambientPass.renderLightPass();
  }
}
