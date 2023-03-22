import type { vec2, vec3 } from "gl-matrix"
import type { Material } from "./material";

export class Vertex {
  public position: vec3;
  public normal: vec3;
  public texCoord: vec2;
  public static readonly strideSize: number = 8;

  public static writeBuffer(vertex: Vertex, buffer: Float32Array, offset: number) {
    buffer.set(vertex.position, offset);
    buffer.set(vertex.normal, offset + 3);
    buffer.set(vertex.texCoord, offset + 6);
  }
}

export class TriangleFace {
  public vertices: [number, number, number];

  public static writeBuffer(face: TriangleFace, buffer: Uint16Array, offset: number) {
    buffer.set(face.vertices, offset);
  }
}

export class Mesh {
  public vertices: Vertex[];
  public faces: TriangleFace[];
  public material: Material;

  public static writeVertexBuffer(mesh: Mesh, buffer: Float32Array) {
    for (let i = 0; i < mesh.vertices.length; i++) {
      Vertex.writeBuffer(mesh.vertices[i], buffer, i * Vertex.strideSize);
    }
  }

  public static writeIndexBuffer(mesh: Mesh, buffer: Uint16Array) {
    for (let i = 0; i < mesh.faces.length; i++) {
      TriangleFace.writeBuffer(mesh.faces[i], buffer, i * 3);
    }
  }

  public getVertexBufferSize(): number {
    return this.vertices.length * Vertex.strideSize * 4;
  }

  public getIndexBufferSize(): number {
    return this.faces.length * 3 * 2;
  }
}

export class Model {
  public meshes: Mesh[];
  public materials: Material[];

  public async loadAllMaterials(device: GPUDevice) {
    for (let i = 0; i < this.materials.length; i++) {
      await this.materials[i].loadToGPU(device);
    }
  }
}