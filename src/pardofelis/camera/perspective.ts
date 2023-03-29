// perpective projected camera
// by chengtian.he
// 2023.2.28

import { vec3, mat4 } from "gl-matrix";

import { Camera } from "./camera";

export class PerspectiveCamera extends Camera {
  // camera coord basis
  front: vec3;
  up: vec3;
  right: vec3;
  // perspective param
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(
    position: vec3, forward: vec3, up?: vec3,
    fov?: number, aspect?: number, near?: number, far?: number
  ) {
    super();
    this.setParams(position, forward, up, fov, aspect, near, far);
  }

  setParams(
    position: vec3, front: vec3, up?: vec3,
    fov?: number, aspect?: number, near?: number, far?: number
  ) {
    this.position = position;
    this.front = front;
    this.up = up;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.checkParams();
  }

  private checkParams() {
    vec3.normalize(this.front, this.front);
    // default values
    if (this.up == null) {
      this.up = vec3.create();
      vec3.set(this.up, 0, 0, 1);
      if (vec3.equals(this.front, this.up)) {
        vec3.set(this.up, 1, 0, 0);
      }
    }
    vec3.normalize(this.up, this.up);
    this.fov = this.fov == null ? 60 : this.fov;
    this.aspect = this.aspect == null ? 1 : this.aspect;
    this.near = this.near == null ? 0.01 : this.near;
    this.far = this.far == null ? 1000 : this.far;
    // calculate orthogonal vectors
    this.right = vec3.create();
    vec3.cross(this.right, this.front, this.up);
    vec3.cross(this.up, this.right, this.front);
  }

  getLookAtPoint() {
    const result = vec3.create();
    vec3.add(result, this.position, this.front);
    return result;
  }

  getViewMatrix() {
    const result = mat4.create();
    mat4.lookAt(result, this.position, this.getLookAtPoint(), this.up);
    return result;
  }

  getProjMatrix() {
    const result = mat4.create();
    // use perspectiveZO for WebGPU's NDC coord system
    mat4.perspectiveZO(result, this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    return result;
  }
}
