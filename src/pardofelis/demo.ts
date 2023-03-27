import { mat4 } from "gl-matrix";

import vertWGSL from "./shader/demo.vert.wgsl?raw";
import fragWGSL from "./shader/demo.frag.wgsl?raw";

import { PerspectiveCamera } from "./camera/perspective";

import { Mesh, Model, Vertex } from "./mesh/mesh";
import { Material } from "./mesh/material";
import { OBJModelParser } from "./mesh/obj_parser";

import { ModelUniformManager, SceneUniformManager } from "./uniform/pardofelis";

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

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.modelUniform.bgCamera.gpuBindGroupLayout,
          this.modelUniform.bgMaterial.gpuBindGroupLayout,
          this.sceneUniform.bgLight.gpuBindGroupLayout,
        ]
      }),
      vertex: {
        module: this.device.createShaderModule({ code: vertWGSL }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: Vertex.strideSize * 4,
            attributes: [
              // position
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              // normal
              {
                shaderLocation: 1,
                offset: 12,
                format: "float32x3",
              },
              // texCoord
              {
                shaderLocation: 2,
                offset: 24,
                format: "float32x2",
              },
            ]
          }
        ]
      },
      fragment: {
        module: this.device.createShaderModule({ code: fragWGSL }),
        entryPoint: "main",
        targets: [{ format: format }]
      },
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

    let pointLightsProp = this.sceneUniform.bgLight.getProperty("pointLights");
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

    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);

    this.models.forEach(info => {
      info.model.meshes.forEach(m => {
        this.camera.toBindGroup(info.modelUniform.bgCamera, info.modelMtx);
        m.material.toBindGroup(info.modelUniform.bgMaterial, this.device);
        info.modelUniform.bufferMgr.writeBuffer(this.device);
        this.sceneUniform.bufferMgr.writeBuffer(this.device);

        passEncoder.setBindGroup(0, info.modelUniform.bgCamera.gpuBindGroup);
        passEncoder.setBindGroup(1, info.modelUniform.bgMaterial.gpuBindGroup);
        passEncoder.setBindGroup(2, this.sceneUniform.bgLight.gpuBindGroup);
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
