// shader classes
// by chengtian.he
// 2023.3.28

import axios from "axios";

import type { IGPUObject } from "../gpu_object";
import { checkStatus } from "../util/http";
import { ShaderPreprocessor } from "./shader_preprocess";
import { getDirectoryPath } from "../util/path";

export abstract class Shader implements IGPUObject {
  sourceFilePath: string;
  sourceCode: string;
  preprocessor: ShaderPreprocessor;
  processedSourceCode: string;
  gpuShaderModule: GPUShaderModule;

  constructor(sourceFilePath: string) {
    this.sourceFilePath = sourceFilePath;
    this.preprocessor = new ShaderPreprocessor();
  }

  async fetchSource() {
    let rsp = await axios.get(this.sourceFilePath, { responseType: "text" });
    if (!checkStatus(rsp)) {
      console.error("fetch shader source failed", this.sourceFilePath, rsp);
      return;
    }
    this.sourceCode = rsp.data;
    this.processedSourceCode = await this.preprocessor.process(this.sourceCode, getDirectoryPath(this.sourceFilePath));
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

  constructor(sourceFilePath: string, bufferLayout?: GPUVertexBufferLayout[]) {
    super(sourceFilePath);
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

  constructor(sourceFilePath: string, targets: GPUColorTargetState[]) {
    super(sourceFilePath);
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