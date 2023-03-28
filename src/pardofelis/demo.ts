import { Vertex } from "./mesh/mesh";

import { ModelUniformManager, SceneUniformManager } from "./uniform/pardofelis";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { getPardofelisDemoScene } from "./scene/pardofelis";

export default class PardofelisDemo {
  private adapter: GPUAdapter;
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private depthTexture: GPUTexture;
  private renderPassDesciptor: GPURenderPassDescriptor;
  private pipeline: GPURenderPipeline;

  private scene: Scene;
  private sceneUniform: SceneUniformManager;
  private modelUniformPrototype: ModelUniformManager;
  private modelUniforms: ModelUniformManager[] = [];

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

    let shaderVert = new VertexShader("shader/demo.vert.wgsl", [Vertex.getGPUVertexBufferLayout()]);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);
    let shaderFrag = new FragmentShader("shader/demo.frag.wgsl", [{ format: format }]);
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

    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
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
