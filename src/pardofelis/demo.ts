import { vec3, mat4 } from "gl-matrix";

import vertWGSL from "./shader/demo.vert.wgsl?raw";
import fragWGSL from "./shader/demo.frag.wgsl?raw";

import { PerspectiveCamera } from "./camera/perspective";

import { CameraUniformObject } from "./uniform/camera";
import { MaterialUniformObject } from "./uniform/material";
import { LightUniformObject } from "./uniform/light";

import { Mesh, Model, Vertex } from "./mesh/mesh";
import { Material } from "./mesh/material";

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

export default class PardofelisDemo {
  private adapter: GPUAdapter;
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private vertexBuffer: GPUBuffer;
  private indexBuffer: GPUBuffer;
  private cameraUniformObj: CameraUniformObject;
  private materialUniformObj: MaterialUniformObject;
  private lightUniformObj: LightUniformObject;
  private depthTexture: GPUTexture;
  private renderPassDesciptor: GPURenderPassDescriptor;
  private pipeline: GPURenderPipeline;

  private camera: PerspectiveCamera;

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

    this.vertexBuffer = this.device.createBuffer({
      size: unitCubeMesh.getVertexBufferSize(),
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    Mesh.writeVertexBuffer(unitCubeMesh, new Float32Array(this.vertexBuffer.getMappedRange()));
    this.vertexBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: unitCubeMesh.getIndexBufferSize(),
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    Mesh.writeIndexBuffer(unitCubeMesh, new Uint16Array(this.indexBuffer.getMappedRange()));
    this.indexBuffer.unmap();

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
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
        cullMode: "back"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      }
    });

    this.cameraUniformObj = CameraUniformObject.create(this.device, this.pipeline);

    this.materialUniformObj = MaterialUniformObject.create(this.device, this.pipeline);
    await unitCubeMaterial.loadToGPU(this.device);

    this.lightUniformObj = LightUniformObject.create(this.device, this.pipeline);
    let lightWorldPos = vec3.create();
    vec3.set(lightWorldPos, 0, 0, 3);
    let lightColor = vec3.create();
    vec3.set(lightColor, 0, 0, 100);
    let lightWorldPos2 = vec3.create();
    vec3.set(lightWorldPos2, 3, 0, 0);
    let lightColor2 = vec3.create();
    vec3.set(lightColor2, 100, 100, 0);
    this.lightUniformObj.set([
      {
        worldPos: lightWorldPos,
        color: lightColor,
      },
      {
        worldPos: lightWorldPos2,
        color: lightColor2,
      },
    ]);

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

    let camPos = vec3.create();
    vec3.set(camPos, 3, 2, 2);
    let camFront = vec3.create();
    vec3.set(camFront, -3, -2, -2);
    this.camera = PerspectiveCamera.create(camPos, camFront, null, 60,
      this.canvas.width / this.canvas.height);
    console.log(this.camera);
    this.isInit = true;
  }

  private frame() {
    if (this.isStopped) return;

    let mtxModel = mat4.create();
    mat4.identity(mtxModel);
    this.cameraUniformObj.set(this.camera, mtxModel);
    this.cameraUniformObj.writeBuffer();
    this.lightUniformObj.writeBuffer();

    unitCubeMaterial.writeUniformObject(this.materialUniformObj);

    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(CameraUniformObject.gpuBindGroupIndex, this.cameraUniformObj.gpuBindGroup);
    this.materialUniformObj.setBindGroup(passEncoder);
    passEncoder.setBindGroup(LightUniformObject.gpuBindGroupIndex, this.lightUniformObj.gpuBindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    passEncoder.drawIndexed(36);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(() => this.frame());
  }

  public startRender() {
    if (!this.isInit) return;
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(() => this.frame());
  }

  public stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}
