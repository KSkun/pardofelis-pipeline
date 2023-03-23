export interface IUniformObject {
  gpuDevice: GPUDevice;
  gpuBindGroupLayout: GPUBindGroupLayout;

  setBindGroup(encoder: GPURenderPassEncoder, index: number): void;
}