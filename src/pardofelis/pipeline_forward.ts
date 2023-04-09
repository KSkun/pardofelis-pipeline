// forward pipeline
// by chengtian.he
// 2023.4.9

import { Vertex } from "./mesh/mesh";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { PipelineBase } from "./pipeline";

export class PardofelisForwardPipeline extends PipelineBase {
  private renderPassDesciptor: GPURenderPassDescriptor;
  private pipeline: GPURenderPipeline;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    super(canvas, scene);
  }

  protected async onInit() {
    await this.initPipeline();
  }

  private async initPipeline() {
    let shaderVert = new VertexShader("/shader/demo.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("/shader/demo.frag.wgsl", [{ format: this.canvasFormat }]);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.device);

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.modelUniformPrototype.bgMVP.gpuBindGroupLayout,
          this.modelUniformPrototype.bgMaterial.gpuBindGroupLayout,
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
      }
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
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.canvasContext.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);

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
  }
}
