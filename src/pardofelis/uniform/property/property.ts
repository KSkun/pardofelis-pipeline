// base class of uniform property
// by chengtian.he
// 2023.3.27

export type UniformPropertyType = "u32" | "f32"
  | "vec2_f32" | "vec3_f32" | "vec4_f32"
  | "vec2_u32"
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
    // if serialization is specified, use object's instead of default one
    if (isUniformPropertySerializable(value)) {
      value.onPropertySet(this);
      return;
    }
    this.internalSet(value);
  }

  protected internalSet(value: any) {
    this.value = value;
  }

  abstract writeBuffer(buffer: ArrayBuffer, offset: number): void;
}

// custom serialization to uniform property
export interface IUniformPropertySerializable {
  onPropertySet(property: UniformProperty): void;
}

// check if an object implements IUniformPropertySerializable
export function isUniformPropertySerializable(obj: any): obj is IUniformPropertySerializable {
  return obj.onPropertySet != undefined;
}