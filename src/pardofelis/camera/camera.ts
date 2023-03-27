import { vec3, mat4, mat3 } from "gl-matrix";
import type { UniformBindGroup } from "../uniform/bind_group";

export abstract class Camera {
  position: vec3;

  abstract getLookAtPoint(): vec3;
  abstract getViewMatrix(): mat4;
  abstract getProjMatrix(): mat4;

  toBindGroup(bg: UniformBindGroup, mtxModel: mat4) {
    let model = mtxModel;
    let view = this.getViewMatrix();
    let proj = this.getProjMatrix();
    let modelView = mat4.create();
    mat4.mul(modelView, view, model);
    let modelViewProj = mat4.create();
    mat4.mul(modelViewProj, proj, modelView);
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
    bg.getProperty("cameraPos").set(this.position);
  }
}
