import type { IGPUObject } from "../gpu_object";
import type { UniformBindGroup } from "./bind_group";
import { isInUniformBuffer } from "./property/property";

export class UniformBufferManager implements IGPUObject {
  private static readonly bindingAlignment = 256;
  private static readonly sizeAlignment = 16;

  bindGroups: UniformBindGroup[];
  bufferSize: number;
  buffer: ArrayBuffer;
  gpuBuffer: GPUBuffer;

  constructor(bindGroups: UniformBindGroup[]) {
    this.bindGroups = bindGroups;
    this.calculateOffset();
    this.buffer = new ArrayBuffer(this.bufferSize);
  }

  private calculateOffset() {
    let curOffset = 0;
    for (let i = 0; i < this.bindGroups.length; i++) {
      let bg = this.bindGroups[i];
      let keys = Object.keys(bg.entries);
      for (let j = 0; j < keys.length; j++) {
        let e = bg.entries[keys[j]];
        if (isInUniformBuffer(e.property.type)) {
          let remainder = curOffset % UniformBufferManager.bindingAlignment;
          if (remainder != 0)
            curOffset += UniformBufferManager.bindingAlignment - remainder;
          e.offset = curOffset;
          e.size = e.property.size;
          let remainder2 = e.property.size % UniformBufferManager.sizeAlignment;
          if (remainder2 != 0)
            e.size += UniformBufferManager.sizeAlignment - remainder2;
          curOffset += e.size;
        }
      }
    }
    this.bufferSize = curOffset;
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuBuffer = device.createBuffer({
      size: this.bufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.bindGroups.forEach(bg => bg.createGPUObjects(device));
  }

  clearGPUObjects() {
    this.bindGroups.forEach(bg => bg.clearGPUObjects());
    this.gpuBuffer = null;
  }

  writeBuffer(device: GPUDevice) {
    this.bindGroups.forEach(bg => {
      bg.writeBuffer(this.buffer);
      bg.createGPUBindGroup(device, this.gpuBuffer);
    });
    device.queue.writeBuffer(this.gpuBuffer, 0, this.buffer, 0, this.bufferSize);
  }
}