// scene info
// by chengtian.he
// 2023.3.28

import { vec3 } from "gl-matrix";
import { ImGui } from "@zhobo63/imgui-ts";

import { Camera } from "../camera/camera";
import { PerspectiveCamera } from "../camera/perspective";
import type { IGPUObject } from "../gpu_object";
import type { UniformBindGroup } from "../uniform/bind_group";
import { AllLightInfo } from "./light";
import { AllModelInfo } from "./model";
import type { IInspectorDrawable } from "../editor/inspector";
import { EditorUtil } from "../editor/util";
import { OrthographicCamera } from "../camera/orthographic";

export class SceneInfo implements IInspectorDrawable {
  ambient: vec3 = [0.2, 0.2, 0.2];
  cullDistance: number = 1000;

  onDrawInspector() {
    let isSceneChanged = false;

    let inputAmbient = [this.ambient[0], this.ambient[1], this.ambient[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.ColorEdit3, "Ambient", inputAmbient, input => this.ambient = input) || isSceneChanged;
    let inputCullDistance = [this.cullDistance];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat, "Cull Distance", inputCullDistance, input => this.cullDistance = input[0]) || isSceneChanged;

    return isSceneChanged;
  }

  toJSON() {
    return {
      ambient: [this.ambient[0], this.ambient[1], this.ambient[2]],
      cullDistance: this.cullDistance,
    };
  }

  static fromJSON(o: any) {
    const r = new SceneInfo();
    r.ambient = o.ambient;
    r.cullDistance = o.cullDistance;
    return r;
  }
}

export class Scene implements IGPUObject {
  info: SceneInfo;
  camera: Camera;
  lights: AllLightInfo;
  models: AllModelInfo;

  constructor() {
    this.info = new SceneInfo;
    this.lights = new AllLightInfo();
    this.models = new AllModelInfo();
  }

  toBindGroup(bg: UniformBindGroup) {
    bg.getProperty("sceneInfo").set({
      cameraPos: this.camera.position,
      ambient: this.info.ambient,
    });
    bg.getProperty("sceneInfoVert").set({
      viewTrans: this.camera.getViewMatrix(),
      projTrans: this.camera.getProjMatrix(),
    });
  }

  toBindGroupComp(bg: UniformBindGroup) {
    bg.getProperty("cullInfo").set({
      cameraPos: this.camera.position,
      viewTrans: this.camera.getViewMatrix(),
      projTrans: this.camera.getProjMatrix(),
      cullDistance: this.info.cullDistance,
    });
  }

  createGPUObjects(device: GPUDevice) {
    this.lights.createGPUObjects(device);
    this.models.createGPUObjects(device);
  }

  clearGPUObjects() {
    this.lights.clearGPUObjects();
    this.models.clearGPUObjects();
  }

  toJSON() {
    return {
      info: this.info.toJSON(),
      camera: this.camera.toJSON(),
      lights: this.lights.toJSON(),
      models: this.models.toJSON(),
    };
  }

  static async fromJSON(o: any, aspect: number) {
    const r = new Scene();
    r.info = SceneInfo.fromJSON(o.info);
    if (o.camera.type == "perspective") r.camera = PerspectiveCamera.fromJSON(o.camera, aspect);
    else if (o.camera.type == "orthographic") r.camera = OrthographicCamera.fromJSON(o.camera);
    else return null;
    r.lights = AllLightInfo.fromJSON(o.lights);
    r.models = await AllModelInfo.fromJSON(o.models);
    return r;
  }
}