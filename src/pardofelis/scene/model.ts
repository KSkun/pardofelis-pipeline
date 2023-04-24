// model info in a scene
// by chengtian.he
// 2023.3.28

import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { ImGui } from "@zhobo63/imgui-ts";
import saveAs from "file-saver";

import type { IGPUObject } from "../gpu_object";
import { Model } from "../mesh/mesh";
import type { IInspectorDrawable } from "../editor/inspector";
import { EditorUtil } from "../editor/util";
import { getFileName } from "../util/path";
import { UniformBindGroup } from "../uniform/bind_group";

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

  toBindGroup(bg: UniformBindGroup) {
    const model = this.getModelMatrix();
    const norm = mat3.create();
    const tmp = mat3.create();
    mat3.fromMat4(norm, model);
    mat3.invert(tmp, norm);
    mat3.transpose(norm, tmp);

    bg.getProperty("modelInfo").set({
      modelTrans: model,
      normalTrans: norm,
    });
  }

  onDrawInspector() {
    let isSceneChanged = false;

    let inputName = [this.name];
    isSceneChanged = EditorUtil.drawField(ImGui.InputText, "Model Name", inputName, input => this.name = input[0]) || isSceneChanged;
    ImGui.Text("Meshes");
    this.model.meshes.forEach(m => ImGui.Text("- " + m.name));
    ImGui.Text("Materials");
    ImGui.SameLine();
    if (ImGui.Button("Export Material")) this.onExportMaterial();
    this.model.materials.forEach(m => ImGui.Text("- " + m.name));
    let inputPosition = [this.position[0], this.position[1], this.position[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isSceneChanged;
    let inputRotation = [this.rotation[0], this.rotation[1], this.rotation[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Rotation", inputRotation, input => this.rotation = input) || isSceneChanged;
    let inputScale = [this.scale[0], this.scale[1], this.scale[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Scale", inputScale, input => this.scale = input) || isSceneChanged;

    return isSceneChanged;
  }

  toJSON() {
    return {
      name: this.name,
      model: this.model.toJSON(),
      position: [this.position[0], this.position[1], this.position[2]],
      rotation: [this.rotation[0], this.rotation[1], this.rotation[2]],
      scale: [this.scale[0], this.scale[1], this.scale[2]],
    };
  }

  static async fromJSON(o: any) {
    const model = await Model.fromJSON(o.model);
    return new SceneModelInfo(o.name, model, o.position, o.rotation, o.scale);
  }

  onExportMaterial() {
    const o = this.model.toJSONMaterial();
    const jsonStr = JSON.stringify(o, undefined, 2);
    console.log(jsonStr);
    saveAs(new Blob([jsonStr]), getFileName(this.model.filePath) + ".mat.json");
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

  toJSON() {
    const o = [];
    this.models.forEach(m => o.push(m.toJSON()));
    return o;
  }

  static async fromJSON(o: any) {
    const r = new AllModelInfo();
    for (let i = 0; i < o.length; i++) {
      r.models.push(await SceneModelInfo.fromJSON(o[i]));
    }
    return r;
  }
}