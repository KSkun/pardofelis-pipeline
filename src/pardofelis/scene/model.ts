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

class SceneModelInstanceInfo implements IInspectorDrawable {
  name: string;
  position: vec3;
  rotation: vec3;
  scale: vec3;

  getModelMatrix() {
    const model = mat4.create();
    const rotationQuat = quat.create();
    quat.fromEuler(rotationQuat, this.rotation[0], this.rotation[1], this.rotation[2]);
    mat4.fromRotationTranslationScale(model, rotationQuat, this.position, this.scale);
    return model;
  }

  toJSON() {
    return this;
  }

  static fromJSON(o: any) {
    const r = new SceneModelInstanceInfo();
    r.name = o.name;
    r.position = o.position;
    r.rotation = o.rotation;
    r.scale = o.scale;
    return r;
  }

  onDrawInspector() {
    let isSceneChanged = false;

    let inputName = [this.name];
    isSceneChanged = EditorUtil.drawField(ImGui.InputText, "Model Name", inputName, input => this.name = input[0]) || isSceneChanged;
    let inputPosition = [this.position[0], this.position[1], this.position[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isSceneChanged;
    let inputRotation = [this.rotation[0], this.rotation[1], this.rotation[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Rotation", inputRotation, input => this.rotation = input) || isSceneChanged;
    let inputScale = [this.scale[0], this.scale[1], this.scale[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Scale", inputScale, input => this.scale = input) || isSceneChanged;

    return isSceneChanged;
  }
}

export class SceneModelInfo implements IInspectorDrawable {
  private static readonly instanceNumMax = 10;

  model: Model;
  instances: SceneModelInstanceInfo[] = [];

  constructor(model: Model) {
    this.model = model;
  }

  addInstance(name: string, position: vec3, rotation: vec3, scale: vec3) {
    if (this.instances.length == SceneModelInfo.instanceNumMax) {
      console.error("instance num is max", this);
      return;
    }
    var r = new SceneModelInstanceInfo();
    r.name = name;
    r.position = position;
    r.rotation = rotation;
    r.scale = scale;
    this.instances.push(r);
  }

  toBindGroup(bg: UniformBindGroup) {
    const tmp = mat3.create();
    const bgObjs = [];
    this.instances.forEach(info => {
      const model = info.getModelMatrix();
      const norm = mat3.create();
      mat3.fromMat4(norm, model);
      mat3.invert(tmp, norm);
      mat3.transpose(norm, tmp);
      bgObjs.push({
        modelTrans: model,
        normalTrans: norm,
      });
    })
    bg.getProperty("modelInfoArr").set({
      size: this.instances.length,
      arr: bgObjs,
    });
  }

  onDrawInspector() {
    ImGui.Text("Meshes");
    this.model.meshes.forEach(m => ImGui.Text("- " + m.name));
    ImGui.Text("Materials");
    ImGui.SameLine();
    if (ImGui.Button("Export Material")) this.onExportMaterial();
    this.model.materials.forEach(m => ImGui.Text("- " + m.name));

    return false;
  }

  toJSON() {
    const infoArr = [];
    this.instances.forEach(info => infoArr.push(info.toJSON()));
    return {
      model: this.model.toJSON(),
      instances: infoArr,
    };
  }

  static async fromJSON(o: any) {
    const model = await Model.fromJSON(o.model);
    const r = new SceneModelInfo(model);
    o.instances.forEach(info => r.instances.push(SceneModelInstanceInfo.fromJSON(info)));
    return r;
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

  add(model: Model) {
    this.models.push(new SceneModelInfo(model));
    return this.models[this.models.length - 1];
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