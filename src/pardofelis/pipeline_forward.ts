// forward pipeline
// by chengtian.he
// 2023.4.9

import _ from "lodash";

import { Vertex } from "./mesh/mesh";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import type { Scene } from "./scene/scene";
import { PipelineBase } from "./pipeline";
import { PardofelisPipelineConfig } from "./pipeline/config";
import { DirLightUniformManager, PointLightUniformManager } from "./uniform/pardofelis";

class ForwardPointLightPass {
  pipeline: PardofelisForwardPipeline;
  lightUniform: PointLightUniformManager;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisForwardPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    this.lightUniform = new PointLightUniformManager();
    this.lightUniform.createGPUObjects(this.pipeline.device);

    const macro = this.pipeline.config.getPredefinedMacros();
    macro["POINT_LIGHT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/forward.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.modelUniformPrototype.bgModel.gpuBindGroupLayout,
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
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

      this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();

      const cmdEncoder = this.pipeline.device.createCommandEncoder();
      const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
      passEncoder.setPipeline(this.gpuPipeline);
      passEncoder.setBindGroup(1, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
      passEncoder.setBindGroup(3, this.lightUniform.bgLight.gpuBindGroup);

      for (let i = 0; i < this.pipeline.scene.models.models.length; i++) {
        const info = this.pipeline.scene.models.models[i];
        const uniformMgr = this.pipeline.modelUniforms[i];
        info.toBindGroup(uniformMgr[0].bgModel);
        uniformMgr[0].bufferMgr.writeBuffer(this.pipeline.device);
        passEncoder.setBindGroup(0, uniformMgr[0].bgModel.gpuBindGroup);

        info.model.meshes.forEach(mesh => {
          mesh.material.toBindGroup(uniformMgr[1].bgMaterial, this.pipeline.device);
          uniformMgr[1].bufferMgr.writeBuffer(this.pipeline.device);
          passEncoder.setBindGroup(2, uniformMgr[1].bgMaterial.gpuBindGroup);

          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          passEncoder.drawIndexed(mesh.faces.length * 3, info.instances.length);
        });
      }

      passEncoder.end();
      this.pipeline.device.queue.submit([cmdEncoder.finish()]);
    }
  }
}

class ForwardDirLightPass {
  pipeline: PardofelisForwardPipeline;
  lightUniform: DirLightUniformManager;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisForwardPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    this.lightUniform = new DirLightUniformManager();
    this.lightUniform.createGPUObjects(this.pipeline.device);

    const macro = this.pipeline.config.getPredefinedMacros();
    macro["DIR_LIGHT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/forward.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.modelUniformPrototype.bgModel.gpuBindGroupLayout,
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
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

      this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();
      const cmdEncoder = this.pipeline.device.createCommandEncoder();
      const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
      passEncoder.setPipeline(this.gpuPipeline);
      passEncoder.setBindGroup(1, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
      passEncoder.setBindGroup(3, this.lightUniform.bgLight.gpuBindGroup);

      for (let i = 0; i < this.pipeline.scene.models.models.length; i++) {
        const info = this.pipeline.scene.models.models[i];
        const uniformMgr = this.pipeline.modelUniforms[i];
        info.toBindGroup(uniformMgr[0].bgModel);
        uniformMgr[0].bufferMgr.writeBuffer(this.pipeline.device);
        passEncoder.setBindGroup(0, uniformMgr[0].bgModel.gpuBindGroup);

        info.model.meshes.forEach(mesh => {
          mesh.material.toBindGroup(uniformMgr[1].bgMaterial, this.pipeline.device);
          uniformMgr[1].bufferMgr.writeBuffer(this.pipeline.device);
          passEncoder.setBindGroup(2, uniformMgr[1].bgMaterial.gpuBindGroup);

          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          passEncoder.drawIndexed(mesh.faces.length * 3, info.instances.length);
        });
      }

      passEncoder.end();
      this.pipeline.device.queue.submit([cmdEncoder.finish()]);
    }
  }
}

class ForwardAmbientPass {
  pipeline: PardofelisForwardPipeline;
  gpuPipeline: GPURenderPipeline;
  gpuPassDesciptor: GPURenderPassDescriptor;

  constructor(pipeline: PardofelisForwardPipeline) {
    this.pipeline = pipeline;
  }

  async initPipeline(shaderVert: VertexShader) {
    const macro = this.pipeline.config.getPredefinedMacros();
    macro["AMBIENT_PASS"] = "1";
    const shaderFrag = new FragmentShader("/shader/forward.frag.wgsl", [{ format: this.pipeline.canvasFormat }], macro);
    await shaderFrag.fetchSource();
    shaderFrag.createGPUObjects(this.pipeline.device);

    this.gpuPipeline = this.pipeline.device.createRenderPipeline({
      layout: this.pipeline.device.createPipelineLayout({
        bindGroupLayouts: [
          this.pipeline.modelUniformPrototype.bgModel.gpuBindGroupLayout,
          this.pipeline.sceneUniform.bgScene.gpuBindGroupLayout,
          this.pipeline.materialUniformPrototype.bgMaterial.gpuBindGroupLayout,
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

    this.gpuPassDesciptor.colorAttachments[0].view = this.pipeline.getCurFrameBuffer().createView();
    const cmdEncoder = this.pipeline.device.createCommandEncoder();
    const passEncoder = cmdEncoder.beginRenderPass(this.gpuPassDesciptor);
    passEncoder.setPipeline(this.gpuPipeline);
    passEncoder.setBindGroup(1, this.pipeline.sceneUniform.bgScene.gpuBindGroup);
    passEncoder.setBindGroup(3, this.pipeline.screenUniform.bgScreen.gpuBindGroup);

    for (let i = 0; i < this.pipeline.scene.models.models.length; i++) {
      const info = this.pipeline.scene.models.models[i];
      const uniformMgr = this.pipeline.modelUniforms[i];
      info.toBindGroup(uniformMgr[0].bgModel);
      uniformMgr[0].bufferMgr.writeBuffer(this.pipeline.device);
      passEncoder.setBindGroup(0, uniformMgr[0].bgModel.gpuBindGroup);

      info.model.meshes.forEach(mesh => {
        mesh.material.toBindGroup(uniformMgr[1].bgMaterial, this.pipeline.device);
        uniformMgr[1].bufferMgr.writeBuffer(this.pipeline.device);
        passEncoder.setBindGroup(2, uniformMgr[1].bgMaterial.gpuBindGroup);

        passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
        passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
        passEncoder.drawIndexed(mesh.faces.length * 3, info.instances.length);
      });
    }

    passEncoder.end();
    this.pipeline.device.queue.submit([cmdEncoder.finish()]);
  }
}

export class PardofelisForwardPipeline extends PipelineBase {
  depthTexture: GPUTexture;
  pointLightPass: ForwardPointLightPass;
  dirLightPass: ForwardDirLightPass;
  ambientPass: ForwardAmbientPass;

  constructor(canvas: HTMLCanvasElement, scene: Scene, config?: PardofelisPipelineConfig) {
    super(canvas, scene, config);
  }

  protected async onInitConfigRefresh() {
    await this.initPipeline();
  }

  private async initPipeline() {
    const macro = this.config.getPredefinedMacros();

    const shaderVert = new VertexShader("/shader/common.vert.wgsl", [Vertex.getGPUVertexBufferLayout()], macro);
    await shaderVert.fetchSource();
    shaderVert.createGPUObjects(this.device);

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.pointLightPass = new ForwardPointLightPass(this);
    await this.pointLightPass.initPipeline(shaderVert);
    this.dirLightPass = new ForwardDirLightPass(this);
    await this.dirLightPass.initPipeline(shaderVert);
    this.ambientPass = new ForwardAmbientPass(this);
    await this.ambientPass.initPipeline(shaderVert);
  }

  protected onRendering() {
    this.pointLightPass.renderLightPass();
    this.dirLightPass.renderLightPass();
    this.ambientPass.renderLightPass();
  }
}
