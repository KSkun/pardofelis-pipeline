// light info in a scene
// by chengtian.he
// 2023.3.28

import type { vec3 } from "gl-matrix";
import _ from "lodash";

import type { IGPUObject } from "../gpu_object";
import { HDRColor } from "../util/color";
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
  pipelineDepthTexture: GPUTexture;
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
    this.pipelineDepthTexture = null;
    this.shadowPassDescriptor = null;
  }

  toJSON(): any {
    return {
      worldPos: [this.worldPos[0], this.worldPos[1], this.worldPos[2]],
      color: [this.color.color[0], this.color.color[1], this.color.color[2]],
      intensity: this.color.intensity,
    };
  }

  static fromJSON(o: any) {
    if (o.type == "point") {
      return PointLight.fromJSONImpl(o);
    }
    return null;
  }
}

export class PointLight extends Light {
  cameras: PerspectiveCamera[];
  singleFaceTextures: GPUTexture[];

  constructor(worldPos: vec3, color: HDRColor) {
    super(worldPos, color);
    this.cameras = [];
    this.cameras.push(new PerspectiveCamera(worldPos, [-1, 0, 0], [0, 1, 0], 90, 1)); // +X
    this.cameras.push(new PerspectiveCamera(worldPos, [1, 0, 0], [0, 1, 0], 90, 1)); // -X
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 1, 0], [0, 0, -1], 90, 1)); // +Y
    this.cameras.push(new PerspectiveCamera(worldPos, [0, -1, 0], [0, 0, 1], 90, 1)); // -Y
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 0, 1], [0, 1, 0], 90, 1)); // +Z
    this.cameras.push(new PerspectiveCamera(worldPos, [0, 0, -1], [0, 1, 0], 90, 1)); // -Z
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
    super.createGPUObjects(device);
    this.depthMap = device.createTexture({
      size: { width: PointLight.depthMapSize, height: PointLight.depthMapSize, depthOrArrayLayers: 6 },
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      format: "r32float",
    });
    this.pipelineDepthTexture = device.createTexture({
      size: { width: PointLight.depthMapSize, height: PointLight.depthMapSize },
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      format: "depth24plus",
    });
    this.shadowPassDescriptor = {
      colorAttachments: [
        {
          view: null,
          clearValue: { r: 1000.0, g: 0.0, b: 1.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        }
      ],
      depthStencilAttachment: {
        view: this.pipelineDepthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
    this.singleFaceTextures = [];
    for (let i = 0; i < 6; i++) {
      this.singleFaceTextures.push(device.createTexture({
        size: { width: PointLight.depthMapSize, height: PointLight.depthMapSize },
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        format: "r32float",
      }));
    }
  }

  clearGPUObjects() {
    super.clearGPUObjects();
    this.singleFaceTextures = null;
  }

  renderDepthMap(pipeline: PipelineBase) {
    for (let i = 0; i < 6; i++) {
      const commandEncoder = pipeline.device.createCommandEncoder();
      const renderPassDescriptor = _.cloneDeep(this.shadowPassDescriptor);
      renderPassDescriptor.colorAttachments[0].view = this.singleFaceTextures[i].createView();
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(pipeline.shadowPassPipeline);

      for (let j = 0; j < pipeline.scene.models.models.length; j++) {
        const info = pipeline.scene.models.models[j];
        const modelMatrix = info.getModelMatrix();
        info.model.meshes.forEach(mesh => {
          const uniformMgr = pipeline.modelUniforms[j];
          this.cameras[i].position = this.worldPos;
          this.cameras[i].toMVPBindGroup(uniformMgr[0].bgMVP, modelMatrix);
          uniformMgr[0].bufferMgr.writeBuffer(pipeline.device);

          passEncoder.setBindGroup(0, uniformMgr[0].bgMVP.gpuBindGroup);
          passEncoder.setVertexBuffer(0, mesh.gpuVertexBuffer);
          passEncoder.setIndexBuffer(mesh.gpuIndexBuffer, "uint32");
          passEncoder.drawIndexed(mesh.faces.length * 3);
        });
      }
      passEncoder.end();
      pipeline.device.queue.submit([commandEncoder.finish()]);
    }
    const commandEncoder = pipeline.device.createCommandEncoder();
    for (let i = 0; i < 6; i++) {
      commandEncoder.copyTextureToTexture(
        { texture: this.singleFaceTextures[i] },
        { texture: this.depthMap, origin: [0, 0, i] },
        [PointLight.depthMapSize, PointLight.depthMapSize]
      );
    }
    pipeline.device.queue.submit([commandEncoder.finish()]);
  }

  toJSON() {
    const o = super.toJSON();
    o.type = "point";
    return o;
  }

  static fromJSONImpl(o: any) {
    return new PointLight(o.worldPos, new HDRColor(o.color, o.intensity));
  }
}

export class AllLightInfo implements IGPUObject {
  pointLights: PointLight[] = [];
  pointLightDepthMapSampler: GPUSampler;
  pointLightDepthMapPlaceholder: GPUTexture;
  pointLightDepthMapPlaceholderView: GPUTextureView;

  add(light: Light) {
    if (light instanceof PointLight) this.pointLights.push(light);
  }

  createGPUObjects(device: GPUDevice) {
    this.pointLights.forEach(pl => pl.createGPUObjects(device));
    this.pointLightDepthMapSampler = device.createSampler();
    this.pointLightDepthMapPlaceholder = device.createTexture({
      size: { width: 1, height: 1, depthOrArrayLayers: 6 },
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
      format: "r32float",
    });
    this.pointLightDepthMapPlaceholderView = this.pointLightDepthMapPlaceholder.createView({ dimension: "cube" });
  }

  clearGPUObjects() {
    this.pointLights.forEach(pl => pl.clearGPUObjects());
    this.pointLightDepthMapSampler = null;
    this.pointLightDepthMapPlaceholder = this.pointLightDepthMapPlaceholderView = null;
  }

  toJSON() {
    const o = {
      pointLights: [],
    };
    this.pointLights.forEach(pl => o.pointLights.push(pl.toJSON()));
    return o;
  }

  static fromJSON(o: any) {
    const r = new AllLightInfo();
    o.pointLights.forEach(oPl => r.pointLights.push(Light.fromJSON(oPl)));
    return r;
  }
}