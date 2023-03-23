import type { GBuffers } from "../pipeline/gbuffer";
import type { IUniformObject } from "./uniform";

export class GBufferUniformObject implements IUniformObject {
  public gBuffers: GBuffers;

  gpuDevice: GPUDevice;
  gpuBindGroupLayout: GPUBindGroupLayout;

  private constructor() { }

  public static create(device: GPUDevice) {
    let obj = new GBufferUniformObject();
    obj.gpuDevice = device;
    obj.gpuBindGroupLayout = GBufferUniformObject.getBindGroupLayout(device);
    return obj;
  }

  public static getBindGroupLayout(device: GPUDevice) {
    return device.createBindGroupLayout({
      entries: [
        // gBufWorldPos
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "unfilterable-float",
          },
        },
        // gBufNormal
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "unfilterable-float",
          },
        },
        // gBufAlbedo
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "unfilterable-float",
          },
        },
        // gBufRMAO
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "unfilterable-float",
          },
        },
      ],
    });
  }

  public set(gBuffers: GBuffers) {
    this.gBuffers = gBuffers;
  }

  public copyFrom(obj: GBufferUniformObject) {
    this.gBuffers = obj.gBuffers;
  }

  public setBindGroup(encoder: GPURenderPassEncoder, index: number) {
    encoder.setBindGroup(index, this.gpuDevice.createBindGroup({
      layout: this.gpuBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.gBuffers.worldPosView,
        },
        {
          binding: 1,
          resource: this.gBuffers.normalView,
        },
        {
          binding: 2,
          resource: this.gBuffers.albedoView,
        },
        {
          binding: 3,
          resource: this.gBuffers.rmaoView,
        },
      ],
    }));
  }
}