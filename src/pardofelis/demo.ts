import { mat4 } from "gl-matrix";

import { PerspectiveCamera } from "./camera/perspective";

import { Model, Vertex } from "./mesh/mesh";
import { OBJModelParser } from "./mesh/obj_parser";

import { ModelUniformManager, SceneUniformManager } from "./uniform/pardofelis";
import { FragmentShader, VertexShader } from "./pipeline/shader";
import { getUnitCubeModel } from "./util/unit_cube";

class DrawModelInfo {
  instanceName: string;
  model: Model;
  modelMtx: mat4;
  modelUniform: ModelUniformManager;
}

function makeDrawModelInfo(name: string, model: Model, device: GPUDevice): DrawModelInfo {
  const result = new DrawModelInfo();
  result.instanceName = name;
  result.model = model;
  result.modelMtx = mat4.create();
  result.modelUniform = new ModelUniformManager();
  result.modelUniform.createGPUObjects(device);
  return result;
}

export default class PardofelisDemo {
  private adapter: GPUAdapter;
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private depthTexture: GPUTexture;
  private renderPassDesciptor: GPURenderPassDescriptor;
  private pipeline: GPURenderPipeline;
  private sceneUniform: SceneUniformManager;
  private modelUniform: ModelUniformManager;

  private camera: PerspectiveCamera;
  private models: DrawModelInfo[] = [];

  private isInit: boolean;
  private isStopped: boolean;

  constructor() {
    this.isInit = false;
    this.isStopped = true;
  }

  public async initDemo() {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.canvas = document.getElementById("target") as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu");

    const format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: format,
    });

    this.modelUniform = new ModelUniformManager();
    this.modelUniform.createGPUObjects(this.device);
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
          this.modelUniform.bgMVP.gpuBindGroupLayout,
          this.modelUniform.bgMaterial.gpuBindGroupLayout,
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

    this.camera = PerspectiveCamera.create([10, 0, -15], [0, 0, 1], null, 80, this.canvas.width / this.canvas.height);
    console.log("camera", this.camera);

    this.camera.toSceneBindGroup(this.sceneUniform.bgScene);
    let pointLightsProp = this.sceneUniform.bgScene.getProperty("pointLights");
    pointLightsProp.set({
      size: 3,
      arr: [
        {
          worldPos: [2, 0, 0],
          color: [0, 0, 1000],
        },
        {
          worldPos: [-2, 0, 0],
          color: [1000, 1000, 0],
        },
        {
          worldPos: [15, 0, -15],
          color: [1000, 1000, 1000],
        },
      ],
    });
    this.sceneUniform.bufferMgr.writeBuffer(this.device);

    let mtxTemp = mat4.create();
    mat4.identity(mtxTemp);

    let unitCubeModel = getUnitCubeModel();
    unitCubeModel.loadAllMaterials(this.device);
    unitCubeModel.loadAllMeshes(this.device);
    let cube1Info = makeDrawModelInfo("cube1", unitCubeModel, this.device);
    mat4.translate(cube1Info.modelMtx, mtxTemp, [0, 5, 0]);
    this.models.push(cube1Info);
    console.log("cube1", cube1Info);
    let cube2Info = makeDrawModelInfo("cube2", unitCubeModel, this.device);
    mat4.translate(cube2Info.modelMtx, mtxTemp, [0, -5, 0]);
    this.models.push(cube2Info);
    console.log("cube2", cube2Info);

    const lumineModelParser = new OBJModelParser("resources/lumine/Lumine.obj");
    let lumineModel = await lumineModelParser.parse();
    lumineModel.loadAllMaterials(this.device);
    lumineModel.loadAllMeshes(this.device);
    let lumineInfo = makeDrawModelInfo("lumine", lumineModel, this.device);
    let mtxTemp2 = mat4.create();
    mat4.rotateY(mtxTemp2, mtxTemp, Math.PI);
    mat4.rotateZ(lumineInfo.modelMtx, mtxTemp2, Math.PI / 2);
    this.models.push(lumineInfo);
    console.log("lumine", lumineInfo);

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

    this.models.forEach(info => {
      info.model.meshes.forEach(m => {
        this.camera.toMVPBindGroup(info.modelUniform.bgMVP, info.modelMtx);
        m.material.toBindGroup(info.modelUniform.bgMaterial, this.device);
        info.modelUniform.bufferMgr.writeBuffer(this.device);

        passEncoder.setBindGroup(0, info.modelUniform.bgMVP.gpuBindGroup);
        passEncoder.setBindGroup(1, info.modelUniform.bgMaterial.gpuBindGroup);
        passEncoder.setBindGroup(2, this.sceneUniform.bgScene.gpuBindGroup);
        passEncoder.setVertexBuffer(0, m.gpuVertexBuffer);
        passEncoder.setIndexBuffer(m.gpuIndexBuffer, "uint32");
        passEncoder.drawIndexed(m.faces.length * 3);
      })
    });

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(async () => await this.frame());
  }

  public startRender() {
    if (!this.isInit) return;
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(async () => await this.frame());
  }

  public stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}
