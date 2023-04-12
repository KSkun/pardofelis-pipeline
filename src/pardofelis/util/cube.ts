// a simple 2x2x2 cube model
// by chengtian.he
// 2023.3.28

import { Material } from "../mesh/material";
import { Mesh, Model } from "../mesh/mesh";

const cubeMaterial = new Material();
cubeMaterial.albedo = [1, 1, 1];
cubeMaterial.roughness = 0.5;
cubeMaterial.metallic = 0.5;
cubeMaterial.ambientOcc = 1;

const cubeMesh = new Mesh();
cubeMesh.vertices = [
  { position: [1, 1, 1], normal: [0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [1, 1, -1], normal: [0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, -1], normal: [0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, 1], normal: [0.577, -0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, 1], normal: [-0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, -1], normal: [-0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, -1], normal: [-0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, 1], normal: [-0.577, -0.577, 0.577], texCoord: [0, 0] },
];
cubeMesh.faces = [
  { vertices: [0, 2, 1] },
  { vertices: [0, 3, 2] },
  { vertices: [4, 5, 6] },
  { vertices: [4, 6, 7] },
  { vertices: [0, 5, 4] },
  { vertices: [0, 1, 5] },
  { vertices: [3, 6, 2] },
  { vertices: [3, 7, 6] },
  { vertices: [0, 7, 3] },
  { vertices: [0, 4, 7] },
  { vertices: [1, 6, 5] },
  { vertices: [1, 2, 6] },
];
cubeMesh.material = cubeMaterial;
cubeMesh.name = "SimpleCubeMesh";

const cubeModel = new Model();
cubeModel.meshes = [cubeMesh];
cubeModel.materials = [cubeMaterial];

export function getSimpleCubeModel() {
  return cubeModel;
}