import type { vec2, vec3 } from "gl-matrix"
import type { IGPUObject } from "../gpu_object";
import type { Material } from "./material";

export class Vertex {
  position: vec3;
  normal: vec3;
  texCoord: vec2;
  static readonly strideSize: number = 8;

  static getGPUVertexBufferLayout(): GPUVertexBufferLayout {
    return {
      arrayStride: Vertex.strideSize * 4,
      attributes: [
        // position
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x3",
        },
        // normal
        {
          shaderLocation: 1,
          offset: 12,
          format: "float32x3",
        },
        // texCoord
        {
          shaderLocation: 2,
          offset: 24,
          format: "float32x2",
        },
      ]
    };
  }

  static writeBuffer(vertex: Vertex, buffer: Float32Array, offset: number) {
    buffer.set(vertex.position, offset);
    buffer.set(vertex.normal, offset + 3);
    buffer.set(vertex.texCoord, offset + 6);
  }
}

export class TriangleFace {
  vertices: [number, number, number];

  static writeBuffer(face: TriangleFace, buffer: Uint32Array, offset: number) {
    buffer.set(face.vertices, offset);
  }
}

export class Mesh implements IGPUObject {
  name: string = "";

  vertices: Vertex[] = [];
  faces: TriangleFace[] = [];
  material: Material = null;

  gpuVertexBuffer: GPUBuffer = null;
  gpuIndexBuffer: GPUBuffer = null;

  static writeVertexBuffer(mesh: Mesh, buffer: Float32Array) {
    for (let i = 0; i < mesh.vertices.length; i++) {
      Vertex.writeBuffer(mesh.vertices[i], buffer, i * Vertex.strideSize);
    }
  }

  static writeIndexBuffer(mesh: Mesh, buffer: Uint32Array) {
    for (let i = 0; i < mesh.faces.length; i++) {
      TriangleFace.writeBuffer(mesh.faces[i], buffer, i * 3);
    }
  }

  private getVertexBufferSize() {
    return this.vertices.length * Vertex.strideSize * 4;
  }

  private getIndexBufferSize() {
    let result = this.faces.length * 3 * 4;
    return result;
  }

  createGPUObjects(device: GPUDevice) {
    this.gpuVertexBuffer = device.createBuffer({
      size: this.getVertexBufferSize(),
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    this.gpuIndexBuffer = device.createBuffer({
      size: this.getIndexBufferSize(),
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    let cpuVertexBuffer = new Float32Array(this.getVertexBufferSize() / 4);
    let cpuIndexBuffer = new Uint32Array(this.getIndexBufferSize() / 4);
    Mesh.writeVertexBuffer(this, cpuVertexBuffer);
    Mesh.writeIndexBuffer(this, cpuIndexBuffer);
    new Float32Array(this.gpuVertexBuffer.getMappedRange()).set(cpuVertexBuffer);
    new Uint32Array(this.gpuIndexBuffer.getMappedRange()).set(cpuIndexBuffer);
    this.gpuVertexBuffer.unmap();
    this.gpuIndexBuffer.unmap();
  }

  clearGPUObjects() {
    this.gpuVertexBuffer = this.gpuIndexBuffer = null;
  }
}

export class Model implements IGPUObject {
  meshes: Mesh[] = [];
  materials: Material[] = [];

  createGPUObjects(device: GPUDevice) {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].createGPUObjects(device);
    }
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].createGPUObjects(device);
    }
  }

  clearGPUObjects() {
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].clearGPUObjects();
    }
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].clearGPUObjects();
    }
  }
}