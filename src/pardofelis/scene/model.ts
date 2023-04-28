// model info in a scene
// by chengtian.he
// 2023.3.28

import { mat3, mat4, quat, vec3, vec4 } from "gl-matrix";
import { ImGui } from "@zhobo63/imgui-ts";
import saveAs from "file-saver";

import type { IGPUObject } from "../gpu_object";
import { BoundingBox, Mesh, Model, TriangleFace, Vertex } from "../mesh/mesh";
import type { IInspectorDrawable } from "../editor/inspector";
import { EditorUtil } from "../editor/util";
import { getFileName } from "../util/path";
import { UniformBindGroup } from "../uniform/bind_group";

class SceneModelInstanceInfo implements IInspectorDrawable {
  owner: SceneModelInfo;
  name: string;
  position: vec3;
  rotation: vec3;
  scale: vec3;
  // batching properties for batched model
  indexOffset: number;
  indexCount: number;
  boundingBox: BoundingBox;

  getModelMatrix() {
    const model = mat4.create();
    const rotationQuat = quat.create();
    quat.fromEuler(rotationQuat, this.rotation[0], this.rotation[1], this.rotation[2]);
    mat4.fromRotationTranslationScale(model, rotationQuat, this.position, this.scale);
    return model;
  }

  getNormalMatrix(model?: mat4) {
    const norm = mat3.create();
    const tmp = mat3.create();
    mat3.fromMat4(norm, model == undefined ? this.getModelMatrix() : model);
    mat3.invert(tmp, norm);
    mat3.transpose(norm, tmp);
    return norm;
  }

  toJSON() {
    return this;
  }

  static fromJSON(o: any) {
    const r = new SceneModelInstanceInfo();
    r.name = o.name;
    r.position = o.position;
    r.rotation = o.rotation;
    r.scale = o.scale;
    return r;
  }

  onDrawInspector() {
    let isSceneChanged = false;

    let inputName = [this.name];
    isSceneChanged = EditorUtil.drawField(ImGui.InputText, "Instance Name", inputName, input => this.name = input[0]) || isSceneChanged;
    let inputPosition = [this.position[0], this.position[1], this.position[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isSceneChanged;
    let inputRotation = [this.rotation[0], this.rotation[1], this.rotation[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Rotation", inputRotation, input => this.rotation = input) || isSceneChanged;
    let inputScale = [this.scale[0], this.scale[1], this.scale[2]];
    isSceneChanged = EditorUtil.drawField(ImGui.InputFloat3, "Scale", inputScale, input => this.scale = input) || isSceneChanged;

    return isSceneChanged;
  }
}

class IgnoreInstanceMeshInfo {
  instanceIndex: number;
  meshIndex: number;
}

export class SceneModelInfo implements IInspectorDrawable {
  private static readonly instanceNumMax = 10;

  model: Model;
  ignoredInstanceMesh: IgnoreInstanceMeshInfo[] = [];
  isBatchedModel: boolean = false;
  instances: SceneModelInstanceInfo[] = [];

  constructor(model: Model) {
    this.model = model;
  }

  addInstance(name: string, position: vec3, rotation: vec3, scale: vec3) {
    if (this.instances.length == SceneModelInfo.instanceNumMax) {
      console.error("instance num is max", this);
      return;
    }
    var r = new SceneModelInstanceInfo();
    r.owner = this;
    r.name = name;
    r.position = position;
    r.rotation = rotation;
    r.scale = scale;
    this.instances.push(r);
  }

  toBindGroup(bg: UniformBindGroup, meshIdx: number, dontIgnore: boolean = false, cullResult?: Uint32Array): number {
    const bgObjs = [];
    for (let i = 0; i < this.instances.length; i++) {
      if (cullResult != undefined && cullResult[i] == 0) continue;
      if (!dontIgnore && this.ignoredInstanceMesh.find(
        info => info.instanceIndex == i && info.meshIndex == meshIdx
      ) != undefined) continue;
      const info = this.instances[i];
      const model = info.getModelMatrix();
      const norm = info.getNormalMatrix(model);
      bgObjs.push({
        modelTrans: model,
        normalTrans: norm,
      });
      if (this.isBatchedModel) break;
    }
    bg.getProperty("modelInfoArr").set({
      size: bgObjs.length,
      arr: bgObjs,
    });
    return bgObjs.length;
  }

  toBindGroupCompInst(bg: UniformBindGroup, meshIdx: number): number {
    const bgObjs = [];
    for (let i = 0; i < this.instances.length; i++) {
      const m = this.model.meshes[meshIdx];
      const info = this.instances[i];
      const model = info.getModelMatrix();
      if (!this.isBatchedModel) {
        const isIgnored = this.ignoredInstanceMesh.find(
          info => info.instanceIndex == i && info.meshIndex == meshIdx
        ) != undefined ? 1 : 0;
        bgObjs.push({
          bboxMin: m.boundingBox.min,
          bboxMax: m.boundingBox.max,
          modelTrans: model,
          cmdBufferIndex: i,
          instanceIndex: i,
          indexOffset: 0,
          indexCount: m.faces.length * 3,
          isIgnored: isIgnored,
        });
      } else {
        bgObjs.push({
          bboxMin: info.boundingBox.min,
          bboxMax: info.boundingBox.max,
          modelTrans: model,
          cmdBufferIndex: i,
          instanceIndex: i,
          indexOffset: info.indexOffset,
          indexCount: info.indexCount,
          isIgnored: 0,
        });
      }
    }
    bg.getProperty("instanceNum").set(bgObjs.length);
    bg.getProperty("instances").set(bgObjs);
    return bgObjs.length;
  }

  onDrawInspector() {
    ImGui.Text("Meshes");
    this.model.meshes.forEach(m => {
      const vertexNum = m.vertices.length;
      const faceNum = m.faces.length;
      ImGui.Text("- " + (m.name == "" ? "(empty name)" : m.name) + ", " + vertexNum + " vertices, " + faceNum + " faces");
    });
    ImGui.Text("Materials");
    ImGui.SameLine();
    if (ImGui.Button("Export Material")) this.onExportMaterial();
    this.model.materials.forEach(m => ImGui.Text("- " + m.name));

    return false;
  }

  toJSON() {
    const infoArr = [];
    this.instances.forEach(info => infoArr.push(info.toJSON()));
    return {
      model: this.model.toJSON(),
      instances: infoArr,
    };
  }

  static async fromJSON(o: any) {
    const model = await Model.fromJSON(o.model);
    const r = new SceneModelInfo(model);
    o.instances.forEach(info => r.instances.push(SceneModelInstanceInfo.fromJSON(info)));
    return r;
  }

  onExportMaterial() {
    const o = this.model.toJSONMaterial();
    const jsonStr = JSON.stringify(o, undefined, 2);
    console.log(jsonStr);
    saveAs(new Blob([jsonStr]), getFileName(this.model.filePath) + ".mat.json");
  }
}

export class AllModelInfo implements IGPUObject {
  models: SceneModelInfo[] = [];

  add(model: Model) {
    this.models.push(new SceneModelInfo(model));
    return this.models[this.models.length - 1];
  }

  createGPUObjects(device: GPUDevice) {
    this.models.forEach(m => m.model.createGPUObjects(device));
  }

  clearGPUObjects() {
    this.models.forEach(m => m.model.clearGPUObjects());
  }

  toJSON() {
    const o = [];
    this.models.forEach(m => o.push(m.toJSON()));
    return o;
  }

  static async fromJSON(o: any) {
    const r = new AllModelInfo();
    for (let i = 0; i < o.length; i++) {
      r.models.push(await SceneModelInfo.fromJSON(o[i]));
    }
    return r;
  }

  private static readonly batchMeshNumMax = 10;
  private static readonly batchMeshSizeLimit = 10;
  private static readonly batchMeshVertexNumLimit = 1000;

  private static checkCanMerge(m: Mesh) {
    if (m.vertices.length >= AllModelInfo.batchMeshVertexNumLimit) return false;
    const bboxSize = vec3.create();
    vec3.sub(bboxSize, m.boundingBox.max, m.boundingBox.min);
    return bboxSize[0] < AllModelInfo.batchMeshSizeLimit
      && bboxSize[1] < AllModelInfo.batchMeshSizeLimit
      && bboxSize[2] < AllModelInfo.batchMeshSizeLimit;
  }

  private static mergeMesh(meshes: [SceneModelInstanceInfo, number, number][]) {
    const model = new Model();
    const mesh = new Mesh();
    model.meshes.push(mesh);
    const info = new SceneModelInfo(model);
    info.isBatchedModel = true;

    meshes.forEach(p => {
      const m = p[0].owner.model.meshes[p[2]];
      mesh.material = m.material;
      const modelTrans = p[0].getModelMatrix();
      const normTrans = p[0].getNormalMatrix(modelTrans);
      const baseVertexIdx = mesh.vertices.length;
      const baseFaceIdx = mesh.faces.length;

      const nInst = new SceneModelInstanceInfo();
      nInst.owner = info;
      nInst.name = p[0].name + " (batched)";
      nInst.position = [0, 0, 0];
      nInst.rotation = [0, 0, 0];
      nInst.scale = [1, 1, 1];
      nInst.indexOffset = baseFaceIdx * 3;
      nInst.indexCount = m.faces.length * 3;
      nInst.boundingBox = new BoundingBox();
      info.instances.push(nInst);

      m.vertices.forEach(v => {
        const nv = new Vertex();
        const nPos = vec4.create();
        vec4.transformMat4(nPos, [v.position[0], v.position[1], v.position[2], 1], modelTrans);
        const nNormal = vec3.create();
        vec3.transformMat3(nNormal, v.normal, normTrans);
        const nTangent = vec4.create();
        vec4.transformMat4(nTangent, [v.tangent[0], v.tangent[1], v.tangent[2], 0], modelTrans);
        nv.position = [nPos[0], nPos[1], nPos[2]];
        nv.normal = nNormal;
        nv.tangent = [nTangent[0], nTangent[1], nTangent[2]];
        nv.texCoord = v.texCoord;
        mesh.vertices.push(nv);
        nInst.boundingBox.add(nv.position);
      });
      m.faces.forEach(f => {
        const nf = new TriangleFace();
        nf.vertices = [f.vertices[0] + baseVertexIdx, f.vertices[1] + baseVertexIdx, f.vertices[2] + baseVertexIdx];
        mesh.faces.push(nf);
      });

      p[0].owner.ignoredInstanceMesh.push({ instanceIndex: p[1], meshIndex: p[2] });
    });

    model.materials.push(mesh.material);
    return info;
  }

  batchMeshes() {
    let mats = {};
    let matToMeshes = {};
    this.models.forEach(model => {
      for (let i = 0; i < model.model.meshes.length; i++) {
        const m = model.model.meshes[i];
        const mat = m.material;
        if (!(mat.name in mats)) {
          mats[mat.name] = mat;
          matToMeshes[mat.name] = [];
        }
        for (let j = 0; j < model.instances.length; j++) {
          matToMeshes[mat.name].push([model.instances[j], j, i]);
        }
      }
    });
    let batchedNum = 0;
    let batchedInstanceNum = 0;
    Object.entries(matToMeshes).forEach(matPair => {
      const matMeshes = <[SceneModelInstanceInfo, number, number][]>matPair[1];
      if (matMeshes.length <= 1) return;
      let curToBatch = [];
      for (let i = 0; i < matMeshes.length; i++) {
        const p = matMeshes[i];
        const m = p[0].owner.model.meshes[p[2]];
        if (AllModelInfo.checkCanMerge(m)) {
          curToBatch.push(p);
        }
        if (curToBatch.length >= AllModelInfo.batchMeshNumMax) {
          const info = AllModelInfo.mergeMesh(curToBatch);
          info.model.filePath = "(batched" + batchedNum + ")";
          batchedNum++;
          batchedInstanceNum += curToBatch.length;
          this.models.push(info);
          curToBatch = [];
        }
      }
      if (curToBatch.length > 0) {
        const info = AllModelInfo.mergeMesh(curToBatch);
        info.model.filePath = "(batched" + batchedNum + ")";
        batchedNum++;
        batchedInstanceNum += curToBatch.length;
        this.models.push(info);
      }
    });
    return batchedInstanceNum;
  }
}