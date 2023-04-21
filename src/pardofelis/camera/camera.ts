// base class for cameras in scene
// by chengtian.he
// 2023.2.28

import { vec3, mat4, mat3 } from "gl-matrix";

import type { UniformBindGroup } from "../uniform/bind_group";
import type { UniformPropertyStruct } from "../uniform/property/struct";
import type { IInspectorDrawable } from "../editor/inspector";

export abstract class Camera implements IInspectorDrawable {
  position: vec3;
  // camera coord basis
  front: vec3;
  up: vec3;
  right: vec3;

  constructor(position: vec3, front: vec3, up?: vec3) {
    this.position = position;
    this.front = front;
    this.up = up;
    this.checkParams();
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

  abstract getProjMatrix(): mat4;

  protected checkParams() {
    vec3.normalize(this.front, this.front);
    // default values
    if (this.up == null || this.up == undefined) {
      this.up = vec3.create();
      vec3.set(this.up, 0, 1, 0);
      if (vec3.equals(this.front, this.up)) {
        vec3.set(this.up, 1, 0, 0);
      }
    }
    vec3.normalize(this.up, this.up);
    // calculate orthogonal vectors
    this.right = vec3.create();
    vec3.cross(this.right, this.front, this.up);
    vec3.cross(this.up, this.right, this.front);
  }

  toMVPBindGroup(bg: UniformBindGroup, mtxModel: mat4) {
    let model = mtxModel;
    let view = this.getViewMatrix();
    let proj = this.getProjMatrix();
    let modelView = mat4.create();
    mat4.mul(modelView, view, model);
    let modelViewProj = mat4.create();
    mat4.mul(modelViewProj, proj, modelView);
    // normal vector transform
    let norm = mat3.create();
    let tmp = mat3.create();
    mat3.fromMat4(norm, model);
    mat3.invert(tmp, norm);
    mat3.transpose(norm, tmp);

    bg.getProperty("mtxMVP").set({
      model: model,
      view: view,
      proj: proj,
      modelView: modelView,
      modelViewProj: modelViewProj,
      norm: norm,
    });
  }

  toSceneBindGroup(bg: UniformBindGroup) {
    (<UniformPropertyStruct>bg.getProperty("sceneInfo")).properties.cameraPos.set(this.position);
  }

  abstract onDrawInspector(): boolean;

  toJSON(): any {
    return {
      type: "MODIFY_THIS_IN_SUBCLASS",
      position: [this.position[0], this.position[1], this.position[2]],
    };
  }
}
