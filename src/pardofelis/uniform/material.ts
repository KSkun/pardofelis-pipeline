import type { vec3 } from "gl-matrix";

export class MaterialUniformObject {
  public color: vec3;
  public roughness: number;
  public metallic: number;
  public ambientOcc: number;

  private gpuDevice: GPUDevice;
  private gpuPipeline: GPURenderPipeline;
  private gpuBuffer: GPUBuffer;
  public gpuBindGroup: GPUBindGroup;
  public static readonly gpuBindGroupIndex: number = 1;

  public static create(device: GPUDevice, pipeline: GPURenderPipeline) {
    let obj = new MaterialUniformObject();
    obj.gpuDevice = device;
    obj.gpuPipeline = pipeline;
    obj.gpuBuffer = device.createBuffer({
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.gpuBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(MaterialUniformObject.gpuBindGroupIndex),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: obj.gpuBuffer,
            offset: 0,
            size: 256,
          },
        },
      ],
    });
    return obj;
  }

  public set(color: vec3, roughness: number, metallic: number, ambientOcc: number) {
    this.color = color;
    this.roughness = roughness;
    this.metallic = metallic;
    this.ambientOcc = ambientOcc;
  }

  public writeBuffer() {
    let buf0 = new Float32Array(64);
    buf0.set(this.color, 0);
    buf0.set([this.roughness, this.metallic, this.ambientOcc], 3);
    this.gpuDevice.queue.writeBuffer(this.gpuBuffer, 0, buf0.buffer, 0, 256);
  }
}