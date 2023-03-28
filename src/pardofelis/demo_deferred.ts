import { Vertex } from "./mesh/mesh";

import { ModelUniformManager, SceneUniformManager, DeferredUniformManager } from "./uniform/pardofelis";
import { GBuffers } from "./pipeline/gbuffer";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { getPardofelisDemoScene } from "./scene/pardofelis";

export default class PardofelisDemoDeferred {
  private adapter: GPUAdapter;
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private gBuffers: GBuffers;
  private depthTexture: GPUTexture;
  private gBufPassDesciptor: GPURenderPassDescriptor;
  private lightPassDesciptor: GPURenderPassDescriptor;
  private gBufPipeline: GPURenderPipeline;
  private lightPipeline: GPURenderPipeline;

  private scene: Scene;
  private sceneUniform: SceneUniformManager;
  private modelUniformPrototype: ModelUniformManager;
  private modelUniforms: ModelUniformManager[] = [];
  private deferredUniform: DeferredUniformManager;

  private isInit: boolean;
  private isStopped: boolean;

  constructor() {
    this.isInit = false;
    this.isStopped = true;
  }

  async initDemo() {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.canvas = document.getElementById("target") as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu");

    const format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: format,
    });

    this.modelUniformPrototype = new ModelUniformManager();
    this.modelUniformPrototype.createGPUObjects(this.device);
    this.sceneUniform = new SceneUniformManager();
    this.sceneUniform.createGPUObjects(this.device);
    this.deferredUniform = new DeferredUniformManager();
    this.deferredUniform.createGPUObjects(this.device);

    let gBufShaderVert = new VertexShader("shader/demo.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await gBufShaderVert.fetchSource();
    gBufShaderVert.createGPUObjects(this.device);
    let gBufShaderFrag = new FragmentShader("shader/demo_gbuf.frag.wgsl", GBuffers.getGPUColorTargetStates());
    await gBufShaderFrag.fetchSource();
    gBufShaderFrag.createGPUObjects(this.device);

    this.gBufPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.modelUniformPrototype.bgMVP.gpuBindGroupLayout,
          this.modelUniformPrototype.bgMaterial.gpuBindGroupLayout,
        ],
      }),
      vertex: gBufShaderVert.gpuVertexState,
      fragment: gBufShaderFrag.gpuFragmentState,
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      }
    });

    let lightShaderVert = new VertexShader("shader/demo_light.vert.wgsl");
    await lightShaderVert.fetchSource();
    lightShaderVert.createGPUObjects(this.device);
    let lightShaderFrag = new FragmentShader("shader/demo_light.frag.wgsl", [{ format: format }]);
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

    this.gBuffers = GBuffers.create(this.device, [this.canvas.width, this.canvas.height]);

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.gBufPassDesciptor = {
      colorAttachments: [
        {
          view: this.gBuffers.worldPosView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: this.gBuffers.normalView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: this.gBuffers.albedoView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
        {
          view: this.gBuffers.rmaoView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
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
    };

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

    this.gBuffers.toBindGroup(this.deferredUniform.bgGBuffer);
    this.deferredUniform.bufferMgr.writeBuffer(this.device);

    this.scene = await getPardofelisDemoScene(this.canvas.width / this.canvas.height);
    this.scene.createGPUObjects(this.device);
    this.scene.models.models.forEach(_ => {
      const mgr = new ModelUniformManager();
      mgr.createGPUObjects(this.device);
      this.modelUniforms.push(mgr);
    });
    this.scene.toBindGroup(this.sceneUniform.bgScene);
    this.sceneUniform.bufferMgr.writeBuffer(this.device);

    this.isInit = true;
  }

  private async frame() {
    if (this.isStopped) return;
    // console.log("frame");

    // g-buffer pass
    let commandEncoder = this.device.createCommandEncoder();
    let renderPassDescriptor = this.gBufPassDesciptor;
    let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.gBufPipeline);

    for (let i = 0; i < this.scene.models.models.length; i++) {
      const info = this.scene.models.models[i];
      info.model.meshes.forEach(mesh => {
        const uniformMgr = this.modelUniforms[i];
        this.scene.camera.toMVPBindGroup(uniformMgr.bgMVP, info.modelTransform);
        mesh.material.toBindGroup(uniformMgr.bgMaterial, this.device);
        uniformMgr.bufferMgr.writeBuffer(this.device);

        passEncoder.setBindGroup(0, uniformMgr.bgMVP.gpuBindGroup);
        passEncoder.setBindGroup(1, uniformMgr.bgMaterial.gpuBindGroup);
        passEncoder.setBindGroup(2, this.sceneUniform.bgScene.gpuBindGroup);
        passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
        passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
        passEncoder.drawIndexed(mesh.faces.length * 3);
      });
    }

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    // light pass
    commandEncoder = this.device.createCommandEncoder();
    renderPassDescriptor = this.lightPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.lightPipeline);

    passEncoder.setBindGroup(0, this.sceneUniform.bgScene.gpuBindGroup);
    passEncoder.setBindGroup(1, this.deferredUniform.bgGBuffer.gpuBindGroup);
    passEncoder.draw(6);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(async () => await this.frame());
  }

  startRender() {
    if (!this.isInit) return;
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(async () => await this.frame());
  }

  stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}
