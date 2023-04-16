// texture uniform property
// by chengtian.he
// 2023.3.27

import { UniformProperty } from "./property";

export class TextureUniformProperty extends UniformProperty {
  sampleType?: GPUTextureSampleType;
  viewDimension?: GPUTextureViewDimension;

  constructor(sampleType?: GPUTextureSampleType, viewDimension?: GPUTextureViewDimension) {
    super();
    this.type = "texture";
    this.alignment = this.size = -1; // invalid for texture
    this.sampleType = sampleType;
    this.viewDimension = viewDimension;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number): void {
    // do nothing
  }
}