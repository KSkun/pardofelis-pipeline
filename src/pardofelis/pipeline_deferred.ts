// deferred pipeline
// by chengtian.he
// 2023.4.9

import { Vertex } from "./mesh/mesh";
import { DeferredUniformManager } from "./uniform/pardofelis";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { GBuffers } from "./pipeline/gbuffer";
import { PipelineBase } from "./pipeline";

export class PardofelisDeferredPipeline extends PipelineBase {
  gBuffers: GBuffers;
  gBufPassDesciptor: GPURenderPassDescriptor;
  lightPassDesciptor: GPURenderPassDescriptor;
  gBufPipeline: GPURenderPipeline;
  lightPipeline: GPURenderPipeline;

  deferredUniform: DeferredUniformManager;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    super(canvas, scene);
  }

  protected async onInit() {
    await this.initGBuffer();
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
    let gBufShaderVert = new VertexShader("/shader/demo.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await gBufShaderVert.fetchSource();
    gBufShaderVert.createGPUObjects(this.device);
    let gBufShaderFrag = new FragmentShader("/shader/demo_gbuf.frag.wgsl", GBuffers.getGPUColorTargetStates());
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
  }

  private async initLightPassPipeline() {
    let lightShaderVert = new VertexShader("/shader/demo_light.vert.wgsl");
    await lightShaderVert.fetchSource();
    lightShaderVert.createGPUObjects(this.device);
    let lightShaderFrag = new FragmentShader("/shader/demo_light.frag.wgsl", [{ format: this.canvasFormat }]);
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
    // g-buffer pass
    let commandEncoder = this.device.createCommandEncoder();
    let renderPassDescriptor = this.gBufPassDesciptor;
    let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.gBufPipeline);

    for (let i = 0; i < this.scene.models.models.length; i++) {
      const info = this.scene.models.models[i];
      const modelMatrix = info.getModelMatrix();
      info.model.meshes.forEach(mesh => {
        const uniformMgr = this.modelUniforms[i];
        this.scene.camera.toMVPBindGroup(uniformMgr.bgMVP, modelMatrix);
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
    renderPassDescriptor.colorAttachments[0].view = this.canvasContext.getCurrentTexture().createView();
    passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.lightPipeline);

    passEncoder.setBindGroup(0, this.sceneUniform.bgScene.gpuBindGroup);
    passEncoder.setBindGroup(1, this.deferredUniform.bgGBuffer.gpuBindGroup);
    passEncoder.draw(6);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
