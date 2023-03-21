import type { vec3 } from "gl-matrix";

export class PointLightParam {
  public worldPos: vec3;
  public color: vec3;
}

export class LightUniformObject {
  public pointLights: PointLightParam[];
  private static readonly pointLightNumMax = 10;

  private gpuDevice: GPUDevice;
  private gpuPipeline: GPURenderPipeline;
  private gpuBuffer: GPUBuffer;
  public gpuBindGroup: GPUBindGroup;
  public static readonly gpuBindGroupIndex: number = 2;

  public static create(device: GPUDevice, pipeline: GPURenderPipeline) {
    let obj = new LightUniformObject();
    obj.gpuDevice = device;
    obj.gpuPipeline = pipeline;
    obj.gpuBuffer = device.createBuffer({
      size: 512,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    obj.gpuBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(LightUniformObject.gpuBindGroupIndex),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: obj.gpuBuffer,
            offset: 0,
            size: 512,
          },
        },
      ],
    });
    return obj;
  }

  public set(pointLights: PointLightParam[]) {
    this.pointLights = pointLights;
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
}