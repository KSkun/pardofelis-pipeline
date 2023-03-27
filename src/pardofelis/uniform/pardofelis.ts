import type { IGPUObject } from "../gpu_object";
import { UniformBindGroup } from "./bind_group";
import { UniformBufferManager } from "./buffer";
import { UniformPropertyArray } from "./property/array";
import { Mat4x4F32UniformProperty, Mat3x3F32UniformProperty, Vec3F32UniformProperty, Float32UniformProperty, Uint32UniformProperty } from "./property/primitives";
import { SamplerUniformProperty } from "./property/sampler";
import { UniformPropertyStruct } from "./property/struct";
import { TextureUniformProperty } from "./property/texture";

export abstract class UniformManager implements IGPUObject {
  bufferMgr: UniformBufferManager;

  createGPUObjects(device: GPUDevice): void {
    this.bufferMgr.createGPUObjects(device);
  }

  clearGPUObjects() {
    this.bufferMgr.clearGPUObjects();
  }
}

export class ModelUniformManager extends UniformManager {
  bgCamera: UniformBindGroup;
  bgMaterial: UniformBindGroup;

  constructor() {
    super();
    this.createCameraBG();
    this.createMaterialBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgCamera,
      this.bgMaterial,
    ]);
  }

  private createCameraBG() {
    this.bgCamera = new UniformBindGroup({
      mtxMVP: {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        property: new UniformPropertyStruct({
          model: new Mat4x4F32UniformProperty(),
          view: new Mat4x4F32UniformProperty(),
          proj: new Mat4x4F32UniformProperty(),
          modelView: new Mat4x4F32UniformProperty(),
          modelViewProj: new Mat4x4F32UniformProperty(),
          norm: new Mat3x3F32UniformProperty(),
        }),
      },
      cameraPos: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new Vec3F32UniformProperty(),
      },
    });
  }

  private createMaterialBG() {
    this.bgMaterial = new UniformBindGroup({
      material: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          albedo: new Vec3F32UniformProperty(),
          roughness: new Float32UniformProperty(),
          metallic: new Float32UniformProperty(),
          ambientOcc: new Float32UniformProperty(),
        }),
      },
      texStatus: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new Uint32UniformProperty(),
      },
      texSampler: {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        property: new SamplerUniformProperty(),
      },
      albedoMap: {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
    });
  }
}

export class SceneUniformManager extends UniformManager {
  bgLight: UniformBindGroup;

  constructor() {
    super();
    this.createLightBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgLight,
    ]);
  }

  private createLightBG() {
    let pointLightNumMax = 10;
    this.bgLight = new UniformBindGroup({
      pointLights: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          size: new Uint32UniformProperty(),
          arr: new UniformPropertyArray(new UniformPropertyStruct({
            worldPos: new Vec3F32UniformProperty(),
            color: new Vec3F32UniformProperty(),
          }), pointLightNumMax),
        }),
      },
    });
  }
}

export class DeferredUniformManager extends UniformManager {
  bgGBuffer: UniformBindGroup;

  constructor() {
    super();
    this.createGBufferBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgGBuffer,
    ]);
  }

  private createGBufferBG() {
    this.bgGBuffer = new UniformBindGroup({
      gBufWorldPos: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float"),
      },
      gBufNormal: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float"),
      },
      gBufAlbedo: {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float"),
      },
      gBufRMAO: {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float"),
      },
    });
  }
}