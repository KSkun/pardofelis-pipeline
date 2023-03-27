import { mat3, mat4, vec3 } from "gl-matrix";
import type { Camera } from "../camera/camera";
import type { IUniformObject } from "./uniform";

export class CameraUniformObject implements IUniformObject {
  public model: mat4;
  public view: mat4;
  public proj: mat4;
  public modelView: mat4;
  public modelViewProj: mat4;
  public norm: mat3;

  public cameraPos: vec3;

  gpuDevice: GPUDevice;
  gpuBuffer: GPUBuffer;
  gpuBindGroupLayout: GPUBindGroupLayout;

  private constructor() { }

  public static create(device: GPUDevice) {
    let obj = new CameraUniformObject();
    obj.gpuDevice = device;
    obj.gpuBuffer = device.createBuffer({
      size: 1024,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.gpuBindGroupLayout = CameraUniformObject.getBindGroupLayout(device);
    return obj;
  }

  public static getBindGroupLayout(device: GPUDevice) {
    return device.createBindGroupLayout({
      entries: [
        // mtxMVP
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        // cameraPos
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ],
    });
  }

  public set(camera: Camera, model: mat4 = null) {
    this.model = model;
    if (this.model == null) this.model = mat4.create();
    this.view = camera.getViewMatrix();
    this.proj = camera.getProjMatrix();
    this.modelView = mat4.create();
    mat4.mul(this.modelView, this.view, this.model);
    this.modelViewProj = mat4.create();
    mat4.mul(this.modelViewProj, this.proj, this.modelView);
    this.norm = mat3.create();
    let tmp = mat3.create();
    mat3.fromMat4(this.norm, this.model);
    mat3.invert(tmp, this.norm);
    mat3.transpose(this.norm, tmp);

    this.cameraPos = camera.position;
  }

  private writeBuffer() {
    let buf0 = new Float32Array(128);
    buf0.set(this.model, 0);
    buf0.set(this.view, 4 * 4);
    buf0.set(this.proj, 4 * 4 * 2);
    buf0.set(this.modelView, 4 * 4 * 3);
    buf0.set(this.modelViewProj, 4 * 4 * 4);
    buf0.set([this.norm[0], this.norm[1], this.norm[2]], 4 * 4 * 5);
    buf0.set([this.norm[3], this.norm[4], this.norm[5]], 4 * 4 * 5 + 4);
    buf0.set([this.norm[6], this.norm[7], this.norm[8]], 4 * 4 * 5 + 8);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0.buffer, 0, 512);

    let buf1 = new Float32Array(128);
    buf1.set(this.cameraPos, 0);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 512, buf1.buffer, 0, 512);
  }

  public setBindGroup(encoder: GPURenderPassEncoder, index: number) {
    this.writeBuffer();
    encoder.setBindGroup(index, this.gpuDevice.createBindGroup({
      layout: this.gpuBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.gpuBuffer,
            offset: 0,
            size: 512,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.gpuBuffer,
            offset: 512,
            size: 512,
          },
        },
      ],
    }));
  }
}