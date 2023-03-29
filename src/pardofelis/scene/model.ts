// model info in a scene
// by chengtian.he
// 2023.3.28

import type { mat4 } from "gl-matrix";

import type { IGPUObject } from "../gpu_object";
import type { Model } from "../mesh/mesh";

export class SceneModelInfo {
  name: string;
  model: Model;
  modelTransform: mat4;
}

export class AllModelInfo implements IGPUObject {
  models: SceneModelInfo[] = [];

  add(name: string, model: Model, mtxModel: mat4) {
    this.models.push({
      name: name,
      model: model,
      modelTransform: mtxModel,
    });
  }

  createGPUObjects(device: GPUDevice) {
    this.models.forEach(m => m.model.createGPUObjects(device));
  }

  clearGPUObjects() {
    this.models.forEach(m => m.model.clearGPUObjects());
  }
}