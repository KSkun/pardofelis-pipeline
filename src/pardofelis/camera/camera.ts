import type { vec3, mat4 } from "gl-matrix";

export interface ICamera {
  position: vec3;

  getLookAtPoint(): vec3;
  getViewMatrix(): mat4;
  getProjMatrix(): mat4;
}
