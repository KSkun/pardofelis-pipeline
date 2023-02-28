import type { ICamera } from "./camera";
import { vec3, mat4 } from "gl-matrix";

export class PerspectiveCamera implements ICamera {
  public position: vec3;
  public front: vec3;
  public up: vec3;
  public right: vec3;
  public fov: number;
  public aspect: number;
  public near: number;
  public far: number;

  private constructor() { }

  public static create(
    position: vec3, forward: vec3, up?: vec3,
    fov?: number, aspect?: number, near?: number, far?: number
  ): PerspectiveCamera {
    const result = new PerspectiveCamera();
    result.setParams(position, forward, up, fov, aspect, near, far);
    return result;
  }

  public setParams(
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
    // default values
    if (this.up == null) {
      this.up = vec3.create();
      vec3.set(this.up, 0, 0, 1);
    }
    this.fov = this.fov == null ? 60 : this.fov;
    this.aspect = this.aspect == null ? 1 : this.aspect;
    this.near = this.near == null ? 0.01 : this.near;
    this.far = this.far == null ? 1000 : this.far;
    // normalize
    vec3.normalize(this.front, this.front);
    vec3.normalize(this.up, this.up);
    // calculate orthogonal vectors
    this.right = vec3.create();
    vec3.cross(this.right, this.front, this.up);
    vec3.cross(this.up, this.right, this.front);
  }

  public getLookAtPoint(): vec3 {
    const result = vec3.create();
    vec3.add(result, this.position, this.front);
    return result;
  }

  public getViewMatrix(): mat4 {
    const result = mat4.create();
    mat4.lookAt(result, this.position, this.getLookAtPoint(), this.up);
    // console.log(result, this.position, this.getLookAtPoint(), this.up);
    return result;
  }

  public getProjMatrix(): mat4 {
    const result = mat4.create();
    mat4.perspectiveZO(result, this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    return result;
  }
}
