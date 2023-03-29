// primitive types uniform property
// by chengtian.he
// 2023.3.27

import { UniformProperty, type UniformPropertyType } from "./property";

// factory function
export function createUniformProperty(type: UniformPropertyType): UniformProperty {
  let property: UniformProperty = null;
  if (type == "u32") {
    property = new Uint32UniformProperty();
  } else if (type == "f32") {
    property = new Float32UniformProperty();
  } else if (type == "vec2_f32") {
    property = new Vec2F32UniformProperty();
  } else if (type == "vec3_f32") {
    property = new Vec3F32UniformProperty();
  } else if (type == "vec4_f32") {
    property = new Vec4F32UniformProperty();
  } else if (type == "mat3x3_f32") {
    property = new Mat3x3F32UniformProperty();
  } else if (type == "mat4x4_f32") {
    property = new Mat4x4F32UniformProperty();
  }
  return property;
}

export class Uint32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "u32";
    this.alignment = 4;
    this.size = 4;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Uint32Array(buffer, offset, 1)[0] = this.value;
  }
}

export class Float32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "f32";
    this.alignment = 4;
    this.size = 4;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Float32Array(buffer, offset, 1)[0] = this.value;
  }
}

export class Vec2F32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "vec2_f32";
    this.alignment = 8;
    this.size = 8;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Float32Array(buffer, offset, 2).set(this.value);
  }
}

export class Vec3F32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "vec3_f32";
    this.alignment = 16;
    this.size = 12;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Float32Array(buffer, offset, 3).set(this.value);
  }
}

export class Vec4F32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "vec4_f32";
    this.alignment = 16;
    this.size = 16;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Float32Array(buffer, offset, 4).set(this.value);
  }
}

export class Mat3x3F32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "mat3x3_f32";
    this.alignment = 16;
    this.size = 48;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    let arr = new Float32Array(buffer, offset, 12);
    // memory layout like mat3x4
    arr.set([this.value[0], this.value[1], this.value[2]], 0);
    arr.set([this.value[3], this.value[4], this.value[5]], 4);
    arr.set([this.value[6], this.value[7], this.value[8]], 8);
  }
}

export class Mat4x4F32UniformProperty extends UniformProperty {
  constructor() {
    super();
    this.type = "mat4x4_f32";
    this.alignment = 16;
    this.size = 64;
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    new Float32Array(buffer, offset, 16).set(this.value);
  }
}