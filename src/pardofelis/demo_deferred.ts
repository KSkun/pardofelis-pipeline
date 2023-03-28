import { mat4 } from "gl-matrix";

import { PerspectiveCamera } from "./camera/perspective";

import { Mesh, Model, Vertex } from "./mesh/mesh";
import { Material } from "./mesh/material";
import { OBJModelParser } from "./mesh/obj_parser";

import { ModelUniformManager, SceneUniformManager, DeferredUniformManager } from "./uniform/pardofelis";
import { GBuffers } from "./pipeline/gbuffer";
import { FragmentShader, VertexShader } from "./pipeline/shader";

const unitCubeMaterial = new Material();
unitCubeMaterial.albedo = [1, 1, 1];
unitCubeMaterial.roughness = 0.5;
unitCubeMaterial.metallic = 0.5;
unitCubeMaterial.ambientOcc = 1;

const unitCubeMesh = new Mesh();
unitCubeMesh.vertices = [
  { position: [1, 1, 1], normal: [0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [1, 1, -1], normal: [0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, -1], normal: [0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, 1], normal: [0.577, -0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, 1], normal: [-0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, -1], normal: [-0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, -1], normal: [-0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, 1], normal: [-0.577, -0.577, 0.577], texCoord: [0, 0] },
];
unitCubeMesh.faces = [
  { vertices: [0, 2, 1] },
  { vertices: [0, 3, 2] },
  { vertices: [4, 5, 6] },
  { vertices: [4, 6, 7] },
  { vertices: [0, 5, 4] },
  { vertices: [0, 1, 5] },
  { vertices: [3, 6, 2] },
  { vertices: [3, 7, 6] },
  { vertices: [0, 7, 3] },
  { vertices: [0, 4, 7] },
  { vertices: [1, 6, 5] },
  { vertices: [1, 2, 6] },
];
unitCubeMesh.material = unitCubeMaterial;

const unitCubeModel = new Model();
unitCubeModel.meshes = [unitCubeMesh];
unitCubeModel.materials = [unitCubeMaterial];

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
  private sceneUniform: SceneUniformManager;
  private modelUniform: ModelUniformManager;
  private deferredUniform: DeferredUniformManager;

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
          this.modelUniform.bgMVP.gpuBindGroupLayout,
          this.modelUniform.bgMaterial.gpuBindGroupLayout,
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

    this.gBuffers.toBindGroup(this.deferredUniform.bgGBuffer);
    this.deferredUniform.bufferMgr.writeBuffer(this.device);

    let mtxTemp = mat4.create();
    mat4.identity(mtxTemp);

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

    // g-buffer pass
    let commandEncoder = this.device.createCommandEncoder();
    let renderPassDescriptor = this.gBufPassDesciptor;
    let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.gBufPipeline);

    this.models.forEach(info => {
      info.model.meshes.forEach(m => {
        this.camera.toMVPBindGroup(info.modelUniform.bgMVP, info.modelMtx);
        m.material.toBindGroup(info.modelUniform.bgMaterial, this.device);
        info.modelUniform.bufferMgr.writeBuffer(this.device);

        passEncoder.setBindGroup(0, info.modelUniform.bgMVP.gpuBindGroup);
        passEncoder.setBindGroup(1, info.modelUniform.bgMaterial.gpuBindGroup);
        passEncoder.setVertexBuffer(0, m.gpuVertexBuffer);
        passEncoder.setIndexBuffer(m.gpuIndexBuffer, "uint32");
        passEncoder.drawIndexed(m.faces.length * 3);
      })
    });

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
