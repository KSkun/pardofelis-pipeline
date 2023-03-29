// material related classes
// by chengtian.he
// 2023.3.22

import { vec3 } from "gl-matrix";

import type { IGPUObject } from "../gpu_object";
import type { UniformBindGroup } from "../uniform/bind_group";
import type { UniformPropertyStruct } from "../uniform/property/struct";

export class MaterialTexture implements IGPUObject {
  data: ImageBitmap = null;
  format: GPUTextureFormat;
  gpuTexture: GPUTexture = null;

  constructor(format: GPUTextureFormat) {
    this.format = format;
  }

  isValid() {
    return this.data != null;
  }

  createGPUObjects(device: GPUDevice) {
    if (!this.isValid()) return;
    this.gpuTexture = device.createTexture({
      size: [this.data.width, this.data.height, 1],
      format: this.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: this.data },
      { texture: this.gpuTexture },
      [this.data.width, this.data.height]
    );
  }

  clearGPUObjects() {
    this.gpuTexture = null;
  }
}

// we use PBR rough/metal for Pardofelis's base material
// which includes albedo, emission, roughness, metallic, ambient occlusion, normal map as parameters
export class Material implements IGPUObject {
  name: string;

  albedo: vec3 = vec3.create();
  albedoMap: MaterialTexture = new MaterialTexture("rgba8unorm");
  roughness: number = 0;
  roughnessMap: MaterialTexture = new MaterialTexture("r8unorm");
  metallic: number = 0;
  metallicMap: MaterialTexture = new MaterialTexture("r8unorm");
  ambientOcc: number = 1;
  ambientOccMap: MaterialTexture = new MaterialTexture("r8unorm");
  normalMap: MaterialTexture = new MaterialTexture("rgba8unorm");

  createGPUObjects(device: GPUDevice) {
    this.albedoMap.createGPUObjects(device);
    this.roughnessMap.createGPUObjects(device);
    this.metallicMap.createGPUObjects(device);
    this.ambientOccMap.createGPUObjects(device);
    this.normalMap.createGPUObjects(device);
  }

  clearGPUObjects() {
    this.albedoMap.clearGPUObjects();
    this.roughnessMap.clearGPUObjects();
    this.metallicMap.clearGPUObjects();
    this.ambientOccMap.clearGPUObjects();
    this.normalMap.clearGPUObjects();
  }

  private static readonly textureStatusAlbedo = 0x1;

  private getTextureStatus(): number {
    let texStatus = 0;
    if (this.albedoMap.isValid()) texStatus |= Material.textureStatusAlbedo;
    return texStatus;
  }

  toBindGroup(bg: UniformBindGroup, device: GPUDevice) {
    let matStruct = <UniformPropertyStruct>bg.entries.material.property;
    matStruct.properties.albedo.set(this.albedo);
    matStruct.properties.roughness.set(this.roughness);
    matStruct.properties.metallic.set(this.metallic);
    matStruct.properties.ambientOcc.set(this.ambientOcc);

    bg.entries.texStatus.property.set(this.getTextureStatus());
    let emptyTexture = Material.getEmptyTexture(device);
    if (this.albedoMap.isValid()) bg.entries.albedoMap.property.set(this.albedoMap.gpuTexture.createView());
    else bg.entries.albedoMap.property.set(emptyTexture.createView());

    // TODO custom sampler params
    bg.entries.texSampler.property.set(device.createSampler({
      minFilter: "linear",
      magFilter: "linear",
      mipmapFilter: "linear",
      addressModeU: "mirror-repeat",
      addressModeV: "mirror-repeat",
    }));
  }

  // placeholder for empty texture slot
  // TODO find a better practice
  private static getEmptyTexture(device: GPUDevice): GPUTexture {
    return device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
}