import axios from "axios";
import type { IGPUObject } from "../gpu_object";
import { checkStatus } from "../util/http";

export abstract class Shader implements IGPUObject {
  sourceFilePath: string;
  sourceCode: string;
  gpuShaderModule: GPUShaderModule;

  constructor(sourceFilePath: string) {
    this.sourceFilePath = sourceFilePath;
  }

  async fetchSource() {
    let rsp = await axios.get(this.sourceFilePath, { responseType: "text" });
    if (!checkStatus(rsp)) {
      console.error("fetch shader source failed", this.sourceFilePath, rsp);
      return;
    }
    this.sourceCode = rsp.data;
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuShaderModule = device.createShaderModule({ code: this.sourceCode });
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