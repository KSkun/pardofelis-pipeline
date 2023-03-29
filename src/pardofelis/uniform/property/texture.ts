// texture uniform property
// by chengtian.he
// 2023.3.27

import { UniformProperty } from "./property";

export class TextureUniformProperty extends UniformProperty {
  sampleType?: GPUTextureSampleType;

  constructor(sampleType?: GPUTextureSampleType) {
    super();
    this.type = "texture";
    this.alignment = this.size = -1; // invalid for texture
    this.sampleType = sampleType;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number): void {
    // do nothing
  }
}