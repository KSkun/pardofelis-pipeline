// light info in a scene
// by chengtian.he
// 2023.3.28

import type { vec3 } from "gl-matrix";

import type { IGPUObject } from "../gpu_object";
import type { HDRColor } from "../util/color";
import { type IInspectorDrawable } from "../editor/inspector";
import { ImGui } from "@zhobo63/imgui-ts";
import { EditorUtil } from "../editor/util";

export abstract class Light implements IInspectorDrawable {
  worldPos: vec3;
  color: HDRColor;

  constructor(worldPos: vec3, color: HDRColor) {
    this.worldPos = worldPos;
    this.color = color;
  }

  abstract onDrawInspector(): boolean;
}

export class PointLight extends Light {
  onDrawInspector() {
    let isSceneChanged = false;

    let inputWorldPos: [number, number, number] = [this.worldPos[0], this.worldPos[1], this.worldPos[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "World Position", inputWorldPos, input => this.worldPos = input) || isSceneChanged;
    let inputColor: [number, number, number] = [this.color.color[0], this.color.color[1], this.color.color[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.ColorEdit3, "Color", inputColor, input => this.color.color = input) || isSceneChanged;
    let inputIntensity: [number] = [this.color.intensity];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat, "Intensity", inputIntensity, input => this.color.intensity = input[0]) || isSceneChanged;

    return isSceneChanged;
  }
}

export class AllLightInfo implements IGPUObject {
  pointLights: PointLight[] = [];

  add(light: Light) {
    if (light instanceof PointLight) this.pointLights.push(light);
  }

  createGPUObjects(device: GPUDevice) {
    // nothing to do
  }

  clearGPUObjects() {
    // nothing to dos
  }
}