// uniform bind group
// by chengtian.he
// 2023.3.27

import type { IGPUObject } from "../gpu_object";
import type { UniformProperty } from "./property/property";
import type { TextureUniformProperty } from "./property/texture";

export class UniformBindGroupEntry {
  binding: GPUIndex32;
  visibility: GPUShaderStageFlags;
  property: UniformProperty;
  offset?: number;
  size?: number;
}

export class UniformBindGroup implements IGPUObject {
  entries: {[key: string]: UniformBindGroupEntry};
  layoutDescriptor: GPUBindGroupLayoutDescriptor;
  gpuBindGroupEntries: GPUBindGroupEntry[];
  gpuBindGroupLayout: GPUBindGroupLayout;
  gpuBindGroup: GPUBindGroup;

  constructor(entries: {[key: string]: UniformBindGroupEntry}) {
    this.entries = entries;
    this.genLayout();
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuBindGroupLayout = device.createBindGroupLayout(this.layoutDescriptor);
  }

  createGPUBindGroup(device: GPUDevice, buffer: GPUBuffer) {
    this.genDescriptor(buffer);
    this.gpuBindGroup = device.createBindGroup({
      layout: this.gpuBindGroupLayout,
      entries: this.gpuBindGroupEntries,
    });
  }

  clearGPUObjects() {
    this.gpuBindGroupEntries = this.gpuBindGroupLayout = this.gpuBindGroup = null;
  }

  private genLayout() {
    let gpuLayoutEntries: GPUBindGroupLayoutEntry[] = [];
    let keys = Object.keys(this.entries);
    for (let i = 0; i < keys.length; i++) {
      let e = this.entries[keys[i]];
      let gpuE: GPUBindGroupLayoutEntry = {
        binding: e.binding,
        visibility: e.visibility,
      };
      if (e.property.type == "sampler") {
        gpuE.sampler = {};
      } else if (e.property.type == "texture") {
        gpuE.texture = {};
        let textureE = (e as unknown) as TextureUniformProperty;
        if (textureE.sampleType != undefined) gpuE.texture.sampleType = textureE.sampleType;
      } else {
        gpuE.buffer = {};
      }
      gpuLayoutEntries.push(gpuE);
    }
    this.layoutDescriptor = {
      entries: gpuLayoutEntries,
    };
  }

  private genDescriptor(buffer: GPUBuffer) {
    this.gpuBindGroupEntries = [];
    let keys = Object.keys(this.entries);
    for (let i = 0; i < keys.length; i++) {
      let e = this.entries[keys[i]];
      let gpuE: GPUBindGroupEntry = {
        binding: e.binding,
        resource: null,
      };
      if (e.property.type == "sampler" || e.property.type == "texture") {
        gpuE.resource = e.property.value;
      } else {
        gpuE.resource = {
          buffer: buffer,
          offset: e.offset,
          size: e.size,
        };
      }
      this.gpuBindGroupEntries.push(gpuE);
    }
  }

  writeBuffer(buffer: ArrayBuffer) {
    let keys = Object.keys(this.entries);
    for (let i = 0; i < keys.length; i++) {
      let e = this.entries[keys[i]];
      e.property.writeBuffer(buffer, e.offset);
    }
  }

  getProperty(key: string) {
    return this.entries[key].property;
  }
}