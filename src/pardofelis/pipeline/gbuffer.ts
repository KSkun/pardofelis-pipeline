import type { UniformBindGroup } from "../uniform/bind_group";

export class GBuffers {
  public worldPos: GPUTexture;
  public normal: GPUTexture;
  public albedo: GPUTexture;
  public rmao: GPUTexture;

  public worldPosView: GPUTextureView;
  public normalView: GPUTextureView;
  public albedoView: GPUTextureView;
  public rmaoView: GPUTextureView;

  public static create(device: GPUDevice, screenSize: [number, number]) {
    const result = new GBuffers();
    result.worldPos = device.createTexture({
      size: screenSize,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: "rgba16float",
    });
    result.worldPosView = result.worldPos.createView();
    result.normal = device.createTexture({
      size: screenSize,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: "rgba16float",
    });
    result.normalView = result.normal.createView();
    result.albedo = device.createTexture({
      size: screenSize,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: "rgba8unorm",
    });
    result.albedoView = result.albedo.createView();
    result.rmao = device.createTexture({
      size: screenSize,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: "rgba8unorm",
    });
    result.rmaoView = result.rmao.createView();
    return result;
  }

  toBindGroup(bg: UniformBindGroup) {
    bg.entries.gBufWorldPos.property.set(this.worldPos.createView());
    bg.entries.gBufNormal.property.set(this.normal.createView());
    bg.entries.gBufAlbedo.property.set(this.albedo.createView());
    bg.entries.gBufRMAO.property.set(this.rmao.createView());
  }
}