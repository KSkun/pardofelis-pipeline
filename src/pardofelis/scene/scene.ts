// scene info
// by chengtian.he
// 2023.3.28

import type { Camera } from "../camera/camera";
import type { IGPUObject } from "../gpu_object";
import type { UniformBindGroup } from "../uniform/bind_group";
import { AllLightInfo } from "./light";
import { AllModelInfo } from "./model";

export class Scene implements IGPUObject {
  camera: Camera;
  lights: AllLightInfo;
  models: AllModelInfo;

  constructor() {
    this.lights = new AllLightInfo();
    this.models = new AllModelInfo();
  }

  toBindGroup(bg: UniformBindGroup, device: GPUDevice) {
    bg.getProperty("sceneInfo").set({ cameraPos: this.camera.position });
    bg.getProperty("pointLights").set({ size: this.lights.pointLights.length, arr: this.lights.pointLights });
    bg.getProperty("pointLightDepthMapSampler").set(this.lights.pointLightDepthMapSampler);
    for (let i = 0; i < 10; i++) {
      if (i < this.lights.pointLights.length) {
        bg.getProperty("pointLightDepthMap" + i).set(this.lights.pointLights[i].depthMap.createView({
          dimension: "cube",
        }));
      } else {
        bg.getProperty("pointLightDepthMap" + i).set(this.lights.pointLightDepthMapPlaceholderView);
      }
    }
  }

  createGPUObjects(device: GPUDevice) {
    this.lights.createGPUObjects(device);
    this.models.createGPUObjects(device);
  }

  clearGPUObjects() {
    this.lights.clearGPUObjects();
    this.models.clearGPUObjects();
  }
}