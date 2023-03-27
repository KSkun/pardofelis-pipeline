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