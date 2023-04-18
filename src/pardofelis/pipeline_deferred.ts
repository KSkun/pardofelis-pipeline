// deferred pipeline
// by chengtian.he
// 2023.4.9

import _ from "lodash";

import { Vertex } from "./mesh/mesh";
import { DeferredUniformManager } from "./uniform/pardofelis";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { GBuffers } from "./pipeline/gbuffer";
import { PipelineBase } from "./pipeline";
import { PardofelisPipelineConfig } from "./pipeline/config";

export class PardofelisDeferredPipeline extends PipelineBase {
  gBuffers: GBuffers;
  depthTexture: GPUTexture;
  basePassDesciptors: GPURenderPassDescriptor[] = [];
  basePassPipelines: GPURenderPipeline[] = [];
  lightPassDesciptor: GPURenderPassDescriptor;
  lightPipeline: GPURenderPipeline;

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
    let lightShaderVert = new VertexShader("/shader/deferred_light.vert.wgsl", undefined, macro);
    await lightShaderVert.fetchSource();
    lightShaderVert.createGPUObjects(this.device);
    let lightShaderFrag = new FragmentShader("/shader/deferred_light.frag.wgsl", [{ format: this.canvasFormat }], macro);
    await lightShaderFrag.fetchSource();
    lightShaderFrag.createGPUObjects(this.device);

    this.lightPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.sceneUniform.bgScene.gpuBindGroupLayout,
          this.deferredUniform.bgGBuffer.gpuBindGroupLayout,
        ],
      }),
      vertex: lightShaderVert.gpuVertexState,
      fragment: lightShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      }
    });

    this.lightPassDesciptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ]
    };
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
    let commandEncoder = this.device.createCommandEncoder();
    let renderPassDescriptor = _.cloneDeep(this.lightPassDesciptor);;
    renderPassDescriptor.colorAttachments[0].view = this.canvasContext.getCurrentTexture().createView();
    let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.lightPipeline);

    passEncoder.setBindGroup(0, this.sceneUniform.bgScene.gpuBindGroup);
    passEncoder.setBindGroup(1, this.deferredUniform.bgGBuffer.gpuBindGroup);
    passEncoder.draw(6);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
