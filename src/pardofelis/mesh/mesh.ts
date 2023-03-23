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

  public static writeBuffer(face: TriangleFace, buffer: Uint32Array, offset: number) {
    buffer.set(face.vertices, offset);
  }
}

export class Mesh {
  public name: string = "";

  public vertices: Vertex[] = [];
  public faces: TriangleFace[] = [];
  public material: Material = null;

  public gpuVertexBuffer: GPUBuffer = null;
  public gpuIndexBuffer: GPUBuffer = null;

  public static writeVertexBuffer(mesh: Mesh, buffer: Float32Array) {
    for (let i = 0; i < mesh.vertices.length; i++) {
      Vertex.writeBuffer(mesh.vertices[i], buffer, i * Vertex.strideSize);
    }
  }

  public static writeIndexBuffer(mesh: Mesh, buffer: Uint32Array) {
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

  public loadToGPU(device: GPUDevice) {
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
}

export class Model {
  public meshes: Mesh[] = [];
  public materials: Material[] = [];

  public async loadAllMaterials(device: GPUDevice) {
    for (let i = 0; i < this.materials.length; i++) {
      await this.materials[i].loadToGPU(device);
    }
  }

  public loadAllMeshes(device: GPUDevice) {
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].loadToGPU(device);
    }
  }
}