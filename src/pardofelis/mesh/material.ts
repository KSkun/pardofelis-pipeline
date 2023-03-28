import { vec3 } from "gl-matrix";
import type { UniformBindGroup } from "../uniform/bind_group";
import type { UniformPropertyStruct } from "../uniform/property/struct";

export class MaterialTexture {
  public data: ImageBitmap = null;
  public gpuTexture: GPUTexture = null;
}

export class Material {
  public name: string;

  public albedo: vec3 = vec3.create();
  public albedoMap: MaterialTexture = null;
  public roughness: number = 0;
  public roughnessMap: MaterialTexture = null;
  public metallic: number = 0;
  public metallicMap: MaterialTexture = null;
  public ambientOcc: number = 1;
  public ambientOccMap: MaterialTexture = null;
  public normalMap: MaterialTexture = null;

  private static async loadOneToGPU(tex: MaterialTexture, device: GPUDevice, format: GPUTextureFormat) {
    if (tex == null || tex.data == null) return;
    tex.gpuTexture = device.createTexture({
      size: [tex.data.width, tex.data.height, 1],
      format: format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: tex.data },
      { texture: tex.gpuTexture },
      [tex.data.width, tex.data.height]
    );
  }

  public async loadToGPU(device: GPUDevice) {
    await Material.loadOneToGPU(this.albedoMap, device, "rgba8unorm");
    await Material.loadOneToGPU(this.roughnessMap, device, "r8unorm");
    await Material.loadOneToGPU(this.metallicMap, device, "r8unorm");
    await Material.loadOneToGPU(this.ambientOccMap, device, "r8unorm");
    await Material.loadOneToGPU(this.normalMap, device, "rgba8unorm");
  }

  private getTextureStatus(): number {
    let texStatus = 0;
    if (this.albedoMap != null) {
      texStatus |= 0x1;
    }
    return texStatus;
  }

  toBindGroup(bg: UniformBindGroup, device: GPUDevice) {
    let matStruct = (bg.entries.material.property as unknown) as UniformPropertyStruct;
    matStruct.properties.albedo.set(this.albedo);
    matStruct.properties.roughness.set(this.roughness);
    matStruct.properties.metallic.set(this.metallic);
    matStruct.properties.ambientOcc.set(this.ambientOcc);

    bg.entries.texStatus.property.set(this.getTextureStatus());
    let emptyTexture = Material.getEmptyTexture(device);
    if (this.albedoMap != null) bg.entries.albedoMap.property.set(this.albedoMap.gpuTexture.createView());
    else bg.entries.albedoMap.property.set(emptyTexture.createView());

    bg.entries.texSampler.property.set(device.createSampler({
      minFilter: "linear",
      magFilter: "linear",
      mipmapFilter: "linear",
      addressModeU: "mirror-repeat",
      addressModeV: "mirror-repeat",
    }));
  }

  private static getEmptyTexture(device: GPUDevice): GPUTexture {
    return device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
}