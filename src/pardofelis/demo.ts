import { vec3, mat4 } from "gl-matrix";

import vertWGSL from "./shader/demo.vert.wgsl?raw";
import fragWGSL from "./shader/demo.frag.wgsl?raw";

import { PerspectiveCamera } from "./camera/perspective";

import { CameraUniformObject } from "./uniform/camera";
import { MaterialUniformObject } from "./uniform/material";
import { LightUniformObject } from "./uniform/light";

const vertices = new Float32Array([
  1, 1, 1,    0.577, 0.577, 0.577,
  1, 1, -1,   0.577, 0.577, -0.577,
  1, -1, -1,  0.577, -0.577, -0.577,
  1, -1, 1,   0.577, -0.577, 0.577,
  -1, 1, 1,   -0.577, 0.577, 0.577,
  -1, 1, -1,  -0.577, 0.577, -0.577,
  -1, -1, -1, -0.577, -0.577, -0.577,
  -1, -1, 1,  -0.577, -0.577, 0.577,
]);

const indices = new Uint16Array([
  0, 2, 1,
  0, 3, 2,
  4, 5, 6,
  4, 6, 7,
  0, 5, 4,
  0, 1, 5,
  3, 6, 2,
  3, 7, 6,
  0, 7, 3,
  0, 4, 7,
  1, 6, 5,
  1, 2, 6
]);

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

  private isStopped: boolean;

  constructor() {
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
      size: { width: this.canvas.width, height: this.canvas.height }
    });

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({ code: vertWGSL }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 6 * 4, // 6 * float32
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                shaderLocation: 1,
                offset: 12,
                format: "float32x3",
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
    let matColor = vec3.create();
    vec3.set(matColor, 0.2, 0.5, 0.6);
    this.materialUniformObj.set(matColor, 0.5, 0.5, 0);

    this.lightUniformObj = LightUniformObject.create(this.device, this.pipeline);
    let lightWorldPos = vec3.create();
    vec3.set(lightWorldPos, -5, -4, 3);
    let lightColor = vec3.create();
    vec3.set(lightColor, 1, 1, 1);
    this.lightUniformObj.set([
      {
        worldPos: lightWorldPos,
        color: lightColor,
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
    vec3.set(camPos, 3, 2, 1);
    let camFront = vec3.create();
    vec3.set(camFront, -3, -2, -1);
    this.camera = PerspectiveCamera.create(camPos, camFront, null, 60,
      this.canvas.width / this.canvas.height);
    console.log(this.camera);
  }

  private frame() {
    if (this.isStopped) return;

    let mtxModel = mat4.create();
    mat4.identity(mtxModel);
    this.cameraUniformObj.set(this.camera, mtxModel);
    this.cameraUniformObj.writeBuffer();

    this.materialUniformObj.writeBuffer();

    this.lightUniformObj.writeBuffer();

    const commandEncoder = this.device.createCommandEncoder();
    const renderPassDescriptor = this.renderPassDesciptor;
    renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(CameraUniformObject.gpuBindGroupIndex, this.cameraUniformObj.gpuBindGroup);
    passEncoder.setBindGroup(MaterialUniformObject.gpuBindGroupIndex, this.materialUniformObj.gpuBindGroup);
    passEncoder.setBindGroup(LightUniformObject.gpuBindGroupIndex, this.lightUniformObj.gpuBindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    passEncoder.drawIndexed(36);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(() => this.frame());
  }

  public startRender() {
    console.log("start render");
    this.isStopped = false;
    requestAnimationFrame(() => this.frame());
  }

  public stopRender() {
    console.log("stop render");
    this.isStopped = true;
  }
}
