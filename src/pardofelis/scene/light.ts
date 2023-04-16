// light info in a scene
// by chengtian.he
// 2023.3.28

import type { vec3 } from "gl-matrix";
import _ from "lodash";

import type { IGPUObject } from "../gpu_object";
import type { HDRColor } from "../util/color";
import { type IInspectorDrawable } from "../editor/inspector";
import { ImGui } from "@zhobo63/imgui-ts";
import { EditorUtil } from "../editor/util";
import { PipelineBase } from "../pipeline";
import { PerspectiveCamera } from "../camera/perspective";

export abstract class Light implements IInspectorDrawable, IGPUObject {
  worldPos: vec3;
  color: HDRColor;
  // shadow mapping
  depthMap: GPUTexture;
  shadowPassDescriptor: GPURenderPassDescriptor;

  constructor(worldPos: vec3, color: HDRColor) {
    this.worldPos = worldPos;
    this.color = color;
  }

  abstract onDrawInspector(): boolean;

  createGPUObjects(device: GPUDevice) {
  }

  clearGPUObjects() {
    this.depthMap = null;
    this.shadowPassDescriptor = null;
  }
}

export class PointLight extends Light {
  cameras: PerspectiveCamera[];

  constructor(worldPos: vec3, color: HDRColor) {
    super(worldPos, color);
    this.cameras = [];
    this.cameras.push(new PerspectiveCamera(worldPos, [1, 0, 0], [0, 1, 0], 45, 1)); // +X
    this.cameras.push(new PerspectiveCamera(worldPos, [-1, 0, 0], [0, 1, 0], 45, 1)); // -X
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 1, 0], [0, 0, -1], 45, 1)); // +Y
    this.cameras.push(new PerspectiveCamera(worldPos, [0, -1, 0], [0, 0, 1], 45, 1)); // -Y
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 0, 1], [0, 1, 0], 45, 1)); // +Z
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 0, -1], [0, 1, 0], 45, 1)); // -Z
  }

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

  private static readonly depthMapSize = 1024;

  createGPUObjects(device: GPUDevice) {
    this.depthMap = device.createTexture({
      size: { width: PointLight.depthMapSize, height: PointLight.depthMapSize, depthOrArrayLayers: 6 },
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: "depth24plus",
    });
    this.shadowPassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: null,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  renderDepthMap(pipeline: PipelineBase, commandEncoder: GPUCommandEncoder) {
    for (let i = 0; i < 6; i++) {
      const renderPassDescriptor = _.cloneDeep(this.shadowPassDescriptor);
      renderPassDescriptor.depthStencilAttachment.view = this.depthMap.createView({
        dimension: "2d",
        baseArrayLayer: i,
        arrayLayerCount: 1,
      });
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline.shadowPassPipeline);

      for (let j = 0; j < pipeline.scene.models.models.length; j++) {
        const info = pipeline.scene.models.models[j];
        const modelMatrix = info.getModelMatrix();
        info.model.meshes.forEach(mesh => {
          const uniformMgr = pipeline.modelUniforms[j];
          this.cameras[i].toMVPBindGroup(uniformMgr[0].bgMVP, modelMatrix);
          uniformMgr[0].bufferMgr.writeBuffer(pipeline.device);

          passEncoder.setBindGroup(0, uniformMgr[0].bgMVP.gpuBindGroup);
          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          passEncoder.drawIndexed(mesh.faces.length * 3);
        });
      }

      passEncoder.end();
    }
  }
}

export class AllLightInfo implements IGPUObject {
  pointLights: PointLight[] = [];

  add(light: Light) {
    if (light instanceof PointLight) this.pointLights.push(light);
  }

  createGPUObjects(device: GPUDevice) {
    this.pointLights.forEach(pl => pl.createGPUObjects(device));
  }

  clearGPUObjects() {
    this.pointLights.forEach(pl => pl.clearGPUObjects());
  }
}