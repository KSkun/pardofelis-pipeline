import { mat4, vec3 } from "gl-matrix";
import type { ICamera } from "../camera/camera";

export class CameraUniformObject {
  public model: mat4;
  public view: mat4;
  public proj: mat4;
  public modelView: mat4;
  public modelViewProj: mat4;

  public cameraPos: vec3;

  private gpuDevice: GPUDevice;
  private gpuPipeline: GPURenderPipeline;
  private gpuBuffer: GPUBuffer;
  public gpuBindGroup: GPUBindGroup;
  public static readonly gpuBindGroupIndex: number = 0;

  public static create(device: GPUDevice, pipeline: GPURenderPipeline) {
    let obj = new CameraUniformObject();
    obj.gpuDevice = device;
    obj.gpuPipeline = pipeline;
    obj.gpuBuffer = device.createBuffer({
      size: 1024,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.gpuBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(CameraUniformObject.gpuBindGroupIndex),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: obj.gpuBuffer,
            offset: 0,
            size: 512,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: obj.gpuBuffer,
            offset: 512,
            size: 512,
          },
        },
      ],
    });
    return obj;
  }

  public set(camera: ICamera, model: mat4) {
    this.model = model;
    this.view = camera.getViewMatrix();
    this.proj = camera.getProjMatrix();
    this.modelView = mat4.create();
    mat4.mul(this.modelView, this.view, this.model);
    this.modelViewProj = mat4.create();
    mat4.mul(this.modelViewProj, this.proj, this.modelView);

    this.cameraPos = camera.position;
  }

  public writeBuffer() {
    let buf0 = new Float32Array(512);
    buf0.set(this.model, 0);
    buf0.set(this.view, 4 * 4);
    buf0.set(this.proj, 4 * 4 * 2);
    buf0.set(this.modelView, 4 * 4 * 3);
    buf0.set(this.modelViewProj, 4 * 4 * 4);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0.buffer, 0, 512);

    let buf1 = new Float32Array(512);
    buf1.set(this.cameraPos, 0);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 512, buf1.buffer, 0, 512);
  }
}