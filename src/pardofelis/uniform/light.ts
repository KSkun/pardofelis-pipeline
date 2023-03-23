import type { vec3 } from "gl-matrix";
import type { IUniformObject } from "./uniform";

export class PointLightParam {
  public worldPos: vec3;
  public color: vec3;
}

export class LightUniformObject implements IUniformObject {
  public pointLights: PointLightParam[];
  private static readonly pointLightNumMax = 10;

  gpuDevice: GPUDevice;
  gpuBuffer: GPUBuffer;
  gpuBindGroupLayout: GPUBindGroupLayout;

  private constructor() { }

  public static create(device: GPUDevice) {
    let obj = new LightUniformObject();
    obj.gpuDevice = device;
    obj.gpuBuffer = device.createBuffer({
      size: 512,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.gpuBindGroupLayout = LightUniformObject.getBindGroupLayout(device);
    return obj;
  }

  public static getBindGroupLayout(device: GPUDevice) {
    return device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ],
    });
  }

  public set(pointLights: PointLightParam[]) {
    this.pointLights = pointLights;
  }

  public copyFrom(obj: LightUniformObject) {
    this.set(obj.pointLights);
  }

  public writeBuffer() {
    let buf0 = new Uint32Array(1);
    buf0.set([this.pointLights.length], 0);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0.buffer, 0, 4);

    let buf1 = new Float32Array(80);
    let nextIndex1 = 0;
    for (let i = 0; i < LightUniformObject.pointLightNumMax; i++) {
      if (i < this.pointLights.length) {
        buf1.set(this.pointLights[i].worldPos, nextIndex1);
        buf1.set(this.pointLights[i].color, nextIndex1 + 4);
      }
      nextIndex1 += 8;
    }
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 16, buf1.buffer, 0, 320);
  }

  public setBindGroup(encoder: GPURenderPassEncoder, index: number) {
    this.writeBuffer();
    encoder.setBindGroup(index, this.gpuDevice.createBindGroup({
      layout: this.gpuBindGroupLayout,
      entries: [
        // pointLights
        {
          binding: 0,
          resource: {
            buffer: this.gpuBuffer,
            offset: 0,
            size: 512,
          },
        },
      ],
    }));
  }
}