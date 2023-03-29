// GPU related / GPU resource managing interface
// by chengtian.he
// 2023.3.27

export interface IGPUObject {
  // create GPU resources
  createGPUObjects(device: GPUDevice, buffer?: GPUBuffer): void;

  // release GPU resources
  clearGPUObjects(): void;
}