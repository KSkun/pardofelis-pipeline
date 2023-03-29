// model & mesh related classes
// by chengtian.he
// 2023.3.22

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
      arrayStride: Vertex.strideSize * 4, // strideSize * sizeof(f32)
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

// a group of faces shared the same material, handling its own VBO & IBO
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
    return this.vertices.length * Vertex.strideSize;
  }

  private getIndexBufferSize() {
    return this.faces.length * 3;
  }

  createGPUObjects(device: GPUDevice) {
    const vertexBufferSize = this.getVertexBufferSize();
    const indexBufferSize = this.getIndexBufferSize();
    this.gpuVertexBuffer = device.createBuffer({
      size: vertexBufferSize * 4, // vertexBufferSize * sizeof(f32)
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.gpuIndexBuffer = device.createBuffer({
      size: indexBufferSize * 4, // indexBufferSize * sizeof(u32)
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    let cpuVertexBuffer = new Float32Array(vertexBufferSize);
    let cpuIndexBuffer = new Uint32Array(indexBufferSize);
    Mesh.writeVertexBuffer(this, cpuVertexBuffer);
    Mesh.writeIndexBuffer(this, cpuIndexBuffer);
    device.queue.writeBuffer(this.gpuVertexBuffer, 0, cpuVertexBuffer.buffer, 0, vertexBufferSize * 4);
    device.queue.writeBuffer(this.gpuIndexBuffer, 0, cpuIndexBuffer.buffer, 0, indexBufferSize * 4);
  }

  clearGPUObjects() {
    this.gpuVertexBuffer = this.gpuIndexBuffer = null;
  }
}

// a *model* contains multiple meshes and materials
// a *mesh* is a group of faces in the model, often a part of the model, or faces shared the same material, like group in OBJ files
// a *material* is a set of rendering parameters, like MTL file, see Material class
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