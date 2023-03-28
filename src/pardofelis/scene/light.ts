import type { vec3 } from "gl-matrix";
import type { IGPUObject } from "../gpu_object";
import type { HDRColor } from "../util/color";

export abstract class Light {
  worldPos: vec3;
  color: HDRColor;

  constructor(worldPos: vec3, color: HDRColor) {
    this.worldPos = worldPos;
    this.color = color;
  }
}

export class PointLight extends Light {}

export class AllLightInfo implements IGPUObject {
  pointLights: PointLight[] = [];

  add(light: Light) {
    if (light instanceof PointLight) this.pointLights.push(light);
  }

  createGPUObjects(device: GPUDevice) {
  }

  clearGPUObjects() {
  }
}