// forward pipeline
// by chengtian.he
// 2023.4.9

import _ from "lodash";

import { Vertex } from "./mesh/mesh";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { PipelineBase } from "./pipeline";

export class PardofelisForwardPipeline extends PipelineBase {
  depthTexture: GPUTexture;
  renderPassDesciptor: GPURenderPassDescriptor;
  pipeline: GPURenderPipeline;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    super(canvas, scene);
  }

  protected async onInit() {
    await this.initPipeline();
  }

  private async initPipeline() {
    let shaderVert = new VertexShader("/shader/common.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/forward.frag.wgsl", [{ format: this.canvasFormat }]);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.device);

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.mvpUniformPrototype.bgMVP.gpuBindGroupLayout,
          this.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
          this.sceneUniform.bgScene.gpuBindGroupLayout,
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

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.renderPassDesciptor = {
      colorAttachments: [
        {
          view: null,
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

  protected onRendering() {
    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = _.cloneDeep(this.renderPassDesciptor);
    renderPassDescriptor.colorAttachments[0].view = this.canvasContext.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);

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
        passEncoder.setBindGroup(2, this.sceneUniform.bgScene.gpuBindGroup);
        passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
        passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
        passEncoder.drawIndexed(mesh.faces.length * 3);
      });
    }

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
