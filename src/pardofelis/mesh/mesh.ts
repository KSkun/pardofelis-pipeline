// model & mesh related classes
// by chengtian.he
// 2023.3.22

import { vec2, vec3 } from "gl-matrix"

import type { IGPUObject } from "../gpu_object";
import type { Material } from "./material";
import { OBJModelParser } from "./obj_parser";

export class Vertex {
  position: vec3;
  normal: vec3;
  texCoord: vec2;
  tangent: vec3;
  static readonly strideSize: number = 11;

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
        // tangent
        {
          shaderLocation: 3,
          offset: 32,
          format: "float32x3",
        },
      ]
    };
  }

  static writeBuffer(vertex: Vertex, buffer: Float32Array, offset: number) {
    buffer.set(vertex.position, offset);
    buffer.set(vertex.normal, offset + 3);
    buffer.set(vertex.texCoord, offset + 6);
    buffer.set(vertex.tangent, offset + 8);
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

  getAllTangents() {
    this.faces.forEach(f => {
      const v1 = this.vertices[f.vertices[0]];
      const v2 = this.vertices[f.vertices[1]];
      const v3 = this.vertices[f.vertices[2]];

      const deltaPos1 = vec3.create();
      vec3.sub(deltaPos1, v2.position, v1.position);
      const deltaPos2 = vec3.create();
      vec3.sub(deltaPos2, v3.position, v1.position);
      const deltaUV1 = vec2.create();
      vec2.sub(deltaUV1, v2.texCoord, v1.texCoord);
      const deltaUV2 = vec2.create();
      vec2.sub(deltaUV2, v3.texCoord, v1.texCoord);

      const tangent = vec3.create();
      const denom = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV1[1] * deltaUV2[0]);
      vec3.scale(deltaPos1, deltaPos1, deltaUV2[1]);
      vec3.scale(deltaPos2, deltaPos2, -deltaUV1[1]);
      vec3.add(tangent, deltaPos1, deltaPos2);
      vec3.scale(tangent, tangent, denom);
      vec3.normalize(tangent, tangent);

      v1.tangent = tangent;
      v2.tangent = tangent;
      v3.tangent = tangent;
    });
  }
}

// a *model* contains multiple meshes and materials
// a *mesh* is a group of faces in the model, often a part of the model, or faces shared the same material, like group in OBJ files
// a *material* is a set of rendering parameters, like MTL file, see Material class
export class Model implements IGPUObject {
  fileType: string;
  filePath: string; // if created by import, save the import file path
  meshes: Mesh[] = [];
  materials: Material[] = [];
  materialLibFileName: string;

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

  toJSON() {
    return {
      type: this.fileType,
      path: this.filePath,
    }
  }

  static async fromJSON(o: any) {
    if (o.type == "obj") {
      const parser = new OBJModelParser(o.path);
      return await parser.parse();
    }
    return null;
  }

  toJSONMaterial() {
    const o = [];
    this.materials.forEach(mat => o.push(mat.toJSON()));
    return o;
  }
}