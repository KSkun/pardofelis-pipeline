export type UniformPropertyType = "u32" | "f32"
  | "vec2_f32" | "vec3_f32" | "vec4_f32"
  | "mat3x3_f32" | "mat4x4_f32"
  | "array" | "struct"
  | "sampler" | "texture";

export function isInUniformBuffer(type: UniformPropertyType) {
  return type != "sampler" && type != "texture";
}

export abstract class UniformProperty {
  type: UniformPropertyType;
  // buffer
  alignment: number;
  size: number;
  offset: number;
  // value
  value: any;

  set(value: any) {
    this.value = value;
  }

  abstract writeBuffer(buffer: ArrayBuffer, offset: number): void;
}