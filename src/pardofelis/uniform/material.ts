import type { vec3 } from "gl-matrix";
import type { IUniformObject } from "./uniform";

export class MaterialUniformObject implements IUniformObject {
  public albedo: vec3;
  public roughness: number;
  public metallic: number;
  public ambientOcc: number;
  public texStatus: number;

  public texSampler: GPUSampler = null;
  public albedoMap: GPUTexture = null;

  gpuDevice: GPUDevice;
  gpuBuffer: GPUBuffer;
  gpuBindGroupLayout: GPUBindGroupLayout;

  private constructor() { }

  public static create(device: GPUDevice) {
    let obj = new MaterialUniformObject();
    obj.gpuDevice = device;
    obj.gpuBuffer = device.createBuffer({
      size: 512,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.texSampler = device.createSampler({
      minFilter: "linear",
      magFilter: "linear",
      mipmapFilter: "linear",
      addressModeU: "mirror-repeat",
      addressModeV: "mirror-repeat",
    });
    obj.gpuBindGroupLayout = MaterialUniformObject.getBindGroupLayout(device);
    return obj;
  }

  public static getBindGroupLayout(device: GPUDevice) {
    return device.createBindGroupLayout({
      entries: [
        // material
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
        // texStatus
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
        // texSampler
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        // albedoMap
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ],
    });
  }

  public set(albedo: vec3, roughness: number, metallic: number, ambientOcc: number, texStatus: number) {
    this.albedo = albedo;
    this.roughness = roughness;
    this.metallic = metallic;
    this.ambientOcc = ambientOcc;
    this.texStatus = texStatus;
  }

  public setTexture(albedoMap: GPUTexture) {
    this.albedoMap = albedoMap;
  }

  private getEmptyTexture(): GPUTexture {
    return this.gpuDevice.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  public setBindGroup(encoder: GPURenderPassEncoder, index: number) {
    this.writeBuffer();
    let albedoMap = this.albedoMap;
    if (albedoMap == null) albedoMap = this.getEmptyTexture();
    encoder.setBindGroup(index, this.gpuDevice.createBindGroup({
      layout: this.gpuBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.gpuBuffer,
            offset: 0,
            size: 256,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.gpuBuffer,
            offset: 256,
            size: 256,
          },
        },
        {
          binding: 2,
          resource: this.texSampler,
        },
        {
          binding: 3,
          resource: albedoMap.createView(),
        }
      ],
    }));
  }

  private writeBuffer() {
    let buf0 = new Float32Array(64);
    buf0.set(this.albedo, 0);
    buf0.set([this.roughness, this.metallic, this.ambientOcc], 3);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0.buffer, 0, 256);

    let buf1 = new Uint32Array(64);
    buf1[0] = this.texStatus;
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 256, buf1.buffer, 0, 256);
  }
}