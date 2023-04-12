// model info in a scene
// by chengtian.he
// 2023.3.28

import { mat4, quat, vec3 } from "gl-matrix";

import type { IGPUObject } from "../gpu_object";
import type { Model } from "../mesh/mesh";
import type { IInspectorDrawable } from "../editor/inspector";
import { EditorUtil } from "../editor/util";
import { ImGui } from "@zhobo63/imgui-ts";

export class SceneModelInfo implements IInspectorDrawable {
  name: string;
  model: Model;
  position: vec3;
  rotation: vec3;
  scale: vec3;

  constructor(name: string, model: Model, position: vec3, rotation: vec3, scale: vec3) {
    this.name = name;
    this.model = model;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }

  getModelMatrix() {
    const model = mat4.create();
    const rotationQuat = quat.create();
    quat.fromEuler(rotationQuat, this.rotation[0], this.rotation[1], this.rotation[2]);
    mat4.fromRotationTranslationScale(model, rotationQuat, this.position, this.scale);
    return model;
  }

  onDrawInspector() {
    let isSceneChanged = false;

    let inputName = [this.name];
    isSceneChanged = EditorUtil.drawField(ImGui.InputText, "Model Name", inputName, input => this.name = input[0]) || isSceneChanged;
    ImGui.Text("Model");
    this.model.meshes.forEach(m => ImGui.Text("- " + m.name));
    let inputPosition = this.position;
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isSceneChanged;
    let inputRotation = this.rotation;
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Rotation", inputRotation, input => this.rotation = input) || isSceneChanged;
    let inputScale = this.scale;
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Scale", inputScale, input => this.scale = input) || isSceneChanged;

    return isSceneChanged;
  }
}

export class AllModelInfo implements IGPUObject {
  models: SceneModelInfo[] = [];

  add(name: string, model: Model, position: vec3, rotation: vec3, scale: vec3) {
    this.models.push(new SceneModelInfo(name, model, position, rotation, scale));
  }

  createGPUObjects(device: GPUDevice) {
    this.models.forEach(m => m.model.createGPUObjects(device));
  }

  clearGPUObjects() {
    this.models.forEach(m => m.model.clearGPUObjects());
  }
}