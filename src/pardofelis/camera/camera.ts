// base class for cameras in scene
// by chengtian.he
// 2023.2.28

import { vec3, mat4, mat3 } from "gl-matrix";

import type { UniformBindGroup } from "../uniform/bind_group";
import type { UniformPropertyStruct } from "../uniform/property/struct";
import type { IInspectorDrawable } from "../editor/inspector";

export abstract class Camera implements IInspectorDrawable {
  position: vec3;

  abstract getLookAtPoint(): vec3;
  abstract getViewMatrix(): mat4;
  abstract getProjMatrix(): mat4;

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
}
