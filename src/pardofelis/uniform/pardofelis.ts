// uniform bind group definitions used by Pardofelis
// by chengtian.he
// 2023.3.27

import type { IGPUObject } from "../gpu_object";
import { UniformBindGroup } from "./bind_group";
import { UniformBufferManager } from "./buffer";
import { UniformPropertyArray } from "./property/array";
import { Mat4x4F32UniformProperty, Mat3x3F32UniformProperty, Vec3F32UniformProperty, Float32UniformProperty, Uint32UniformProperty, Vec2F32UniformProperty, Vec2U32UniformProperty } from "./property/primitives";
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
  bgModel: UniformBindGroup;

  constructor() {
    super();
    this.createModelBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgModel,
    ]);
  }

  private createModelBG() {
    this.bgModel = new UniformBindGroup({
      modelInfoArr: {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        property: new UniformPropertyStruct({
          size: new Uint32UniformProperty(),
          arr: new UniformPropertyArray(new UniformPropertyStruct({
            modelTrans: new Mat4x4F32UniformProperty(),
            normalTrans: new Mat3x3F32UniformProperty(),
          }), 10),
        }),
      },
    });
  }
}

export class MaterialUniformManager extends UniformManager {
  bgMaterial: UniformBindGroup;

  constructor() {
    super();
    this.createMaterialBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgMaterial,
    ]);
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
      roughnessMap: {
        binding: 4,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      metallicMap: {
        binding: 5,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      ambientOccMap: {
        binding: 6,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      normalMap: {
        binding: 7,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
    });
  }
}

export class SceneUniformManager extends UniformManager {
  bgScene: UniformBindGroup;
  bgSceneEarlyZ: UniformBindGroup;

  constructor() {
    super();
    this.createSceneBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgScene,
      this.bgSceneEarlyZ,
    ]);
  }

  private createSceneBG() {
    this.bgScene = new UniformBindGroup({
      sceneInfo: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          cameraPos: new Vec3F32UniformProperty(),
          ambient: new Vec3F32UniformProperty(),
        }),
      },
      sceneInfoVert: {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        property: new UniformPropertyStruct({
          viewTrans: new Mat4x4F32UniformProperty(),
          projTrans: new Mat4x4F32UniformProperty(),
        }),
      },
      earlyZBuffer: {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("depth"),
      },
    });
    this.bgSceneEarlyZ = new UniformBindGroup({
      sceneInfo: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          cameraPos: new Vec3F32UniformProperty(),
          ambient: new Vec3F32UniformProperty(),
        }),
      },
      sceneInfoVert: {
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        property: new UniformPropertyStruct({
          viewTrans: new Mat4x4F32UniformProperty(),
          projTrans: new Mat4x4F32UniformProperty(),
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

export class ScreenUniformManager extends UniformManager {
  bgScreen: UniformBindGroup;

  constructor() {
    super();
    this.createScreenBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgScreen,
    ]);
  }

  private createScreenBG() {
    this.bgScreen = new UniformBindGroup({
      screenFrameBuffer: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      // DEBUG ONLY
      // screenSize: {
      //   binding: 1,
      //   visibility: GPUShaderStage.FRAGMENT,
      //   property: new Vec2U32UniformProperty(),
      // },
      // debugDrawDepth: {
      //   binding: 2,
      //   visibility: GPUShaderStage.FRAGMENT,
      //   property: new TextureUniformProperty("depth"),
      // },
    });
  }
}

export class PointLightUniformManager extends UniformManager {
  bgLight: UniformBindGroup;

  constructor() {
    super();
    this.createSceneBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgLight,
    ]);
  }

  private createSceneBG() {
    this.bgLight = new UniformBindGroup({
      screenFrameBuffer: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      lightParam: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          worldPos: new Vec3F32UniformProperty(),
          color: new Vec3F32UniformProperty(),
        }),
      },
      depthMapSampler: {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        property: new SamplerUniformProperty("non-filtering"),
      },
      depthMap: {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float", "cube"),
      },
    });
  }
}

export class DirLightUniformManager extends UniformManager {
  bgLight: UniformBindGroup;

  constructor() {
    super();
    this.createSceneBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgLight,
    ]);
  }

  private createSceneBG() {
    this.bgLight = new UniformBindGroup({
      screenFrameBuffer: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty(),
      },
      lightParam: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new UniformPropertyStruct({
          worldPos: new Vec3F32UniformProperty(),
          direction: new Vec3F32UniformProperty(),
          color: new Vec3F32UniformProperty(),
          shadowViewProj: new Mat4x4F32UniformProperty(),
        }),
      },
      depthMapSampler: {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        property: new SamplerUniformProperty("non-filtering"),
      },
      depthMap: {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("unfilterable-float"),
      },
    });
  }
}

export class HiZUniformManager extends UniformManager {
  bgHiZ: UniformBindGroup;

  constructor() {
    super();
    this.createHiZBG();
    this.bufferMgr = new UniformBufferManager([
      this.bgHiZ,
    ]);
  }

  private createHiZBG() {
    this.bgHiZ = new UniformBindGroup({
      prevMipZBuffer: {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        property: new TextureUniformProperty("depth"),
      },
      curMipSize: {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        property: new Vec2U32UniformProperty(),
      },
    });
  }
}