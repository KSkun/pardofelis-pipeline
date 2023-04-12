// light info in a scene
// by chengtian.he
// 2023.3.28

import type { vec3 } from "gl-matrix";

import type { IGPUObject } from "../gpu_object";
import type { HDRColor } from "../util/color";
import { type IInspectorDrawable, InspectorWindow } from "../editor/inspector";
import { ImGui } from "@zhobo63/imgui-ts";

export abstract class Light implements IInspectorDrawable {
  worldPos: vec3;
  color: HDRColor;

  constructor(worldPos: vec3, color: HDRColor) {
    this.worldPos = worldPos;
    this.color = color;
  }

  abstract onDrawInspector(inspector: InspectorWindow): boolean;
}

export class PointLight extends Light {
  onDrawInspector(inspector: InspectorWindow) {
    let isSceneChanged = false;
    let inputWorldPos: [number, number, number] = [this.worldPos[0], this.worldPos[1], this.worldPos[2]];
    if (ImGui.InputFloat3("World Position", inputWorldPos)) {
      this.worldPos = inputWorldPos;
      isSceneChanged = true;
    }
    let inputColor: [number, number, number] = [this.color.color[0], this.color.color[1], this.color.color[2]];
    if (ImGui.ColorEdit3("Color", inputColor)) {
      this.color.color = inputColor;
      isSceneChanged = true;
    }
    let inputIntensity: [number] = [this.color.intensity];
    if (ImGui.InputFloat("Intensity", inputIntensity)) {
      this.color.intensity = inputIntensity[0];
      isSceneChanged = true;
    }
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