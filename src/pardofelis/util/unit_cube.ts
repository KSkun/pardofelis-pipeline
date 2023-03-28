import _ from "lodash";
import { Material } from "../mesh/material";
import { Mesh, Model } from "../mesh/mesh";

const unitCubeMaterial = new Material();
unitCubeMaterial.albedo = [1, 1, 1];
unitCubeMaterial.roughness = 0.5;
unitCubeMaterial.metallic = 0.5;
unitCubeMaterial.ambientOcc = 1;

const unitCubeMesh = new Mesh();
unitCubeMesh.vertices = [
  { position: [1, 1, 1], normal: [0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [1, 1, -1], normal: [0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, -1], normal: [0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [1, -1, 1], normal: [0.577, -0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, 1], normal: [-0.577, 0.577, 0.577], texCoord: [0, 0] },
  { position: [-1, 1, -1], normal: [-0.577, 0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, -1], normal: [-0.577, -0.577, -0.577], texCoord: [0, 0] },
  { position: [-1, -1, 1], normal: [-0.577, -0.577, 0.577], texCoord: [0, 0] },
];
unitCubeMesh.faces = [
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
unitCubeMesh.material = unitCubeMaterial;

const unitCubeModel = new Model();
unitCubeModel.meshes = [unitCubeMesh];
unitCubeModel.materials = [unitCubeMaterial];

export function getUnitCubeModel() {
  return unitCubeModel;
}