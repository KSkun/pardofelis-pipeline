// shader classes
// by chengtian.he
// 2023.3.28

import axios from "axios";

import type { IGPUObject } from "../gpu_object";
import { checkStatus } from "../util/http";
import { type ShaderMacroDefintionList, ShaderPreprocessor } from "./shader_preprocess";

export abstract class Shader implements IGPUObject {
  sourceFilePath: string;
  sourceCode: string;
  preprocessor: ShaderPreprocessor;
  processedSourceCode: string;
  gpuShaderModule: GPUShaderModule;

  constructor(sourceFilePath: string, predefinedMacro?: ShaderMacroDefintionList) {
    this.sourceFilePath = sourceFilePath;
    this.preprocessor = new ShaderPreprocessor(predefinedMacro);
  }

  async fetchSource() {
    console.log("[Shader] load shader", this.sourceFilePath, this.preprocessor.predefinedMacro);
    let rsp = await axios.get(this.sourceFilePath, { responseType: "text" });
    if (!checkStatus(rsp)) {
      console.error("fetch shader source failed", this.sourceFilePath, rsp);
      return;
    }
    this.sourceCode = rsp.data;
    this.processedSourceCode = await this.preprocessor.process(this.sourceCode, "/shader/header");
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuShaderModule = device.createShaderModule({ code: this.processedSourceCode });
  }

  clearGPUObjects() {
    this.gpuShaderModule = null;
  }
}

export class VertexShader extends Shader {
  bufferLayout: GPUVertexBufferLayout[];
  gpuVertexState: GPUVertexState;

  constructor(sourceFilePath: string, bufferLayout?: GPUVertexBufferLayout[], predefinedMacro?: ShaderMacroDefintionList) {
    super(sourceFilePath, predefinedMacro);
    this.sourceFilePath = sourceFilePath;
    this.bufferLayout = bufferLayout;
  }

  createGPUObjects(device: GPUDevice): void {
    super.createGPUObjects(device);
    this.gpuVertexState = {
      module: this.gpuShaderModule,
      entryPoint: "main",
      buffers: this.bufferLayout,
    };
  }
}

export class FragmentShader extends Shader {
  targets: GPUColorTargetState[];
  gpuFragmentState: GPUFragmentState;

  constructor(sourceFilePath: string, targets: GPUColorTargetState[], predefinedMacro?: ShaderMacroDefintionList) {
    super(sourceFilePath, predefinedMacro);
    this.sourceFilePath = sourceFilePath;
    this.targets = targets;
  }

  createGPUObjects(device: GPUDevice): void {
    super.createGPUObjects(device);
    this.gpuFragmentState = {
      module: this.gpuShaderModule,
      entryPoint: "main",
      targets: this.targets,
    };
  }
}