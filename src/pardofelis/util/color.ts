// color & HDR color
// by chengtian.he
// 2023.3.28

import { vec3 } from "gl-matrix";

import { Vec3F32UniformProperty } from "../uniform/property/primitives";
import type { IUniformPropertySerializable, UniformProperty } from "../uniform/property/property";

export class Color implements IUniformPropertySerializable {
  color: vec3;

  constructor(color: vec3) {
    this.color = vec3.create();
    vec3.normalize(this.color, color);
  }

  protected getVec3(): vec3 {
    return this.color;
  }

  onPropertySet(property: UniformProperty): void {
    if (property instanceof Vec3F32UniformProperty) {
      property.set(this.getVec3());
    }
  }
}

export class HDRColor extends Color {
  intensity: number; // exp intensity

  constructor(color: vec3, intensity: number) {
    super(color);
    this.intensity = intensity;
  }

  protected getVec3(): vec3 {
    let result = vec3.create();
    let factor = Math.pow(10, this.intensity);
    vec3.multiply(result, this.color, [factor, factor, factor]);
    return result;
  }
}