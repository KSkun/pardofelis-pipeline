import type { vec3, mat4 } from "gl-matrix";

export default interface ICamera {
  getLookAtPoint(): vec3;

  getViewMatrix(): mat4;

  getProjMatrix(): mat4;
}
