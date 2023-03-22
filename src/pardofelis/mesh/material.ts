import { vec3 } from "gl-matrix";
import type { MaterialUniformObject } from "../uniform/material";

export class MaterialTexture {
  public data: ImageData = null;
  public gpuTexture: GPUTexture = null;
}

export class Material {
  public albedo: vec3 = vec3.create();
  public albedoMap: MaterialTexture = null;
  public roughness: number = 0;
  public roughnessMap: MaterialTexture = null;
  public metallic: number = 0;
  public metallicMap: MaterialTexture = null;
  public ambientOcc: number = 1;
  public ambientOccMap: MaterialTexture = null;
  public normalMap: MaterialTexture = null;

  private isLoadedToGPU = false;

  private static async loadOneToGPU(tex: MaterialTexture, device: GPUDevice, format: GPUTextureFormat) {
    if (tex == null || tex.data == null) return;
    const bitmap = await createImageBitmap(tex.data);
    tex.gpuTexture = device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      format: format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: tex.gpuTexture },
      [bitmap.width, bitmap.height]
    );
  }

  public async loadToGPU(device: GPUDevice) {
    if (this.isLoadedToGPU) return;
    await Material.loadOneToGPU(this.albedoMap, device, "rgba8unorm");
    await Material.loadOneToGPU(this.roughnessMap, device, "r8unorm");
    await Material.loadOneToGPU(this.metallicMap, device, "r8unorm");
    await Material.loadOneToGPU(this.ambientOccMap, device, "r8unorm");
    await Material.loadOneToGPU(this.normalMap, device, "rgba8unorm");
    this.isLoadedToGPU = true;
  }

  private getTextureStatus(): number {
    let texStatus = 0;
    if (this.albedoMap != null) {
      texStatus |= 0x1;
    }
    return texStatus;
  }

  public writeUniformObject(obj: MaterialUniformObject) {
    obj.set(this.albedo, this.roughness, this.metallic, this.ambientOcc, this.getTextureStatus());
    obj.setTexture(this.albedoMap?.gpuTexture);
  }
}