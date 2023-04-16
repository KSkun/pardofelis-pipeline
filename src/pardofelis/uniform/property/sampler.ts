// sample uniform property
// by chengtian.he
// 2023.3.27

import { UniformProperty } from "./property";

export class SamplerUniformProperty extends UniformProperty {
  bindingType: GPUSamplerBindingType;

  constructor(bindingType: GPUSamplerBindingType = "filtering") {
    super();
    this.type = "sampler";
    this.alignment = this.size = -1; // invalid for sampler
    this.bindingType = bindingType;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number): void {
    // do nothing
  }
}