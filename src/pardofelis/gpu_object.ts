export interface IGPUObject {
  createGPUObjects(device: GPUDevice, buffer?: GPUBuffer): void;
  clearGPUObjects(): void;
}