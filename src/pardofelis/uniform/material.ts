import type { vec3 } from "gl-matrix";

export class MaterialUniformObject {
  public albedo: vec3;
  public roughness: number;
  public metallic: number;
  public ambientOcc: number;
  public texStatus: number;

  public texSampler: GPUSampler = null;
  public albedoMap: GPUTexture = null;

  private gpuDevice: GPUDevice;
  private gpuPipeline: GPURenderPipeline;
  private gpuBuffer: GPUBuffer;
  public static readonly gpuBindGroupIndex: number = 1;

  public static create(device: GPUDevice, pipeline: GPURenderPipeline) {
    let obj = new MaterialUniformObject();
    obj.gpuDevice = device;
    obj.gpuPipeline = pipeline;
    obj.gpuBuffer = device.createBuffer({
      size: 512,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.texSampler = device.createSampler({
      "minFilter": "linear",
      "magFilter": "linear",
    });
    return obj;
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

  public setBindGroup(encoder: GPURenderPassEncoder) {
    this.writeBuffer();
    let albedoMap = this.albedoMap;
    if (albedoMap == null) albedoMap = this.getEmptyTexture();
    let bindGroupDescriptor: GPUBindGroupDescriptor = {
      layout: this.gpuPipeline.getBindGroupLayout(MaterialUniformObject.gpuBindGroupIndex),
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
    };
    const gpuBindGroup = this.gpuDevice.createBindGroup(bindGroupDescriptor);
    encoder.setBindGroup(MaterialUniformObject.gpuBindGroupIndex, gpuBindGroup);
  }

  private writeBuffer() {
    let buf0 = new Float32Array(64);
    buf0.set(this.albedo, 0);
    buf0.set([this.roughness, this.metallic, this.ambientOcc], 3);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0, 0, 6);

    let buf1 = new Uint32Array(1);
    buf1[0] = this.texStatus;
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 256, buf1, 0, 1);
  }
}