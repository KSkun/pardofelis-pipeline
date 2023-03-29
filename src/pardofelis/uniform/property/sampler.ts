// sample uniform property
// by chengtian.he
// 2023.3.27

import { UniformProperty } from "./property";

export class SamplerUniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "sampler";
    this.alignment = this.size = -1; // invalid for sampler
  }

  writeBuffer(buffer: ArrayBuffer, offset: number): void {
    // do nothing
  }
}