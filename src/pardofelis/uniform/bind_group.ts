// uniform bind group
// by chengtian.he
// 2023.3.27

import type { IGPUObject } from "../gpu_object";
import type { UniformProperty } from "./property/property";
import { SamplerUniformProperty } from "./property/sampler";
import type { TextureUniformProperty } from "./property/texture";

export class UniformBindGroupEntry {
  binding: GPUIndex32;
  visibility: GPUShaderStageFlags;
  property: UniformProperty;
  offset?: number;
  size?: number;
  bufferType?: "uniform" | "storage" | "ro-storage" | "wo-storage";
  cpuBuffer?: ArrayBuffer;
  gpuBuffer?: GPUBuffer;
}

export class UniformBindGroup implements IGPUObject {
  entries: { [key: string]: UniformBindGroupEntry };
  layoutDescriptor: GPUBindGroupLayoutDescriptor;
  gpuBindGroupEntries: GPUBindGroupEntry[];
  gpuBindGroupLayout: GPUBindGroupLayout;
  gpuBindGroup: GPUBindGroup;

  constructor(entries: { [key: string]: UniformBindGroupEntry }) {
    this.entries = entries;
    this.genLayout();
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuBindGroupLayout = device.createBindGroupLayout(this.layoutDescriptor);
    Object.entries(this.entries).forEach(e => {
      if (e[1].bufferType == "storage" || e[1].bufferType == "ro-storage" || e[1].bufferType == "wo-storage") {
        const bufferSize = Math.max(e[1].property.size, 128);
        e[1].cpuBuffer = new ArrayBuffer(bufferSize);
        let usage = GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE;
        if (e[1].bufferType == "wo-storage") {
          usage |= GPUBufferUsage.INDIRECT;
        }
        e[1].gpuBuffer = device.createBuffer({
          size: bufferSize,
          usage: usage,
        });
      }
    })
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
        let samplerE = e.property as SamplerUniformProperty;
        gpuE.sampler = { type: samplerE.bindingType };
      } else if (e.property.type == "texture") {
        gpuE.texture = {};
        let textureE = e.property as TextureUniformProperty;
        if (textureE.sampleType != undefined) gpuE.texture.sampleType = textureE.sampleType;
        if (textureE.viewDimension != undefined) gpuE.texture.viewDimension = textureE.viewDimension;
      } else {
        gpuE.buffer = {};
        if (e.bufferType == "storage" || e.bufferType == "wo-storage") gpuE.buffer.type = "storage";
        if (e.bufferType == "ro-storage") gpuE.buffer.type = "read-only-storage";
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
        if (e.bufferType == undefined || e.bufferType == "uniform") {
          gpuE.resource = {
            buffer: buffer,
            offset: e.offset,
            size: e.size,
          };
        } else if (e.bufferType == "storage" || e.bufferType == "ro-storage" || e.bufferType == "wo-storage") {
          gpuE.resource = {
            buffer: e.gpuBuffer,
          };
        }
      }
      this.gpuBindGroupEntries.push(gpuE);
    }
  }

  writeBuffer(buffer: ArrayBuffer, device: GPUDevice) {
    let keys = Object.keys(this.entries);
    for (let i = 0; i < keys.length; i++) {
      let e = this.entries[keys[i]];
      if (e.bufferType == undefined || e.bufferType == "uniform") {
        e.property.writeBuffer(buffer, e.offset);
      } else if (e.bufferType == "storage" || e.bufferType == "ro-storage") {
        e.property.writeBuffer(e.cpuBuffer, 0);
        device.queue.writeBuffer(e.gpuBuffer, 0, e.cpuBuffer, 0, e.cpuBuffer.byteLength);
      }
    }
  }

  getProperty(key: string) {
    return this.entries[key].property;
  }
}