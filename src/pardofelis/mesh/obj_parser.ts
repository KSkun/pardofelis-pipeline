// Wavefront OBJ & MTL file parser
// by chengtian.he
// 2023.3.23

import { vec3 } from "gl-matrix";
import OBJFile, { type ITextureVertex, type IVertex } from "obj-file-parser-ts";
import axios from "axios";

import { Vertex, Model, Mesh } from "./mesh";
import { Material } from "./material";
import { checkStatus } from "../util/http";
import { combinePath, getDirectoryPath } from "../util/path";

function makeVertex(position: IVertex, normal: IVertex, texCoord: ITextureVertex): Vertex {
  return {
    position: [position.x, position.y, position.z],
    normal: [normal.x, normal.y, normal.z],
    texCoord: [texCoord.u, texCoord.v],
    tangent: [0, 0, 0],
  };
}

export class OBJModelParser {
  filePath: string;
  model: Model = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async parse() {
    // download OBJ file
    const rsp = await axios.get(this.filePath, { responseType: "text" });
    if (!checkStatus(rsp)) return null;
    // parse OBJ file
    const objFile = new OBJFile(rsp.data);
    const obj = objFile.parse();
    // parse MTL file
    this.model = new Model();
    this.model.fileType = "obj";
    this.model.filePath = this.filePath;
    for (let i = 0; i < obj.materialLibraries.length; i++) {
      const mtlJSONFilePath = combinePath(getDirectoryPath(this.filePath), obj.materialLibraries[i] + ".json");
      let jsonParser = new MaterialJSONParser(mtlJSONFilePath);
      let mats = await jsonParser.parse();
      if (mats == null) {
        const mtlFilePath = combinePath(getDirectoryPath(this.filePath), obj.materialLibraries[i]);
        let mtlParser = new MTLMaterialParser(mtlFilePath);
        mats = await mtlParser.parse();
      }
      this.model.materials = this.model.materials.concat(mats);
    }
    const matDict: { [key: string]: Material } = {};
    for (let i = 0; i < this.model.materials.length; i++) {
      matDict[this.model.materials[i].name] = this.model.materials[i];
    }
    // convert to our Model & Mesh objects
    const meshDict: { [key: string]: Mesh } = {};
    obj.models.forEach(objModel => {
      for (let i = 0; i < objModel.faces.length; i++) {
        const objFace = objModel.faces[i];
        const meshName = objFace.group + "&" + objFace.material;
        if (!(meshName in meshDict)) {
          meshDict[meshName] = new Mesh();
          meshDict[meshName].name = meshName;
          meshDict[meshName].material = matDict[objFace.material];
        }
        const mesh = meshDict[meshName];
        objFace.vertices.forEach(objV => {
          mesh.vertices.push(makeVertex(
            objModel.vertices[objV.vertexIndex - 1],
            objModel.vertexNormals[objV.vertexNormalIndex - 1],
            objModel.textureCoords[objV.textureCoordsIndex - 1]
          ));
        });
        const verticesLength = mesh.vertices.length;
        mesh.faces.push({ vertices: [verticesLength - 3, verticesLength - 2, verticesLength - 1] });
      }
    });
    this.model.meshes = Object.keys(meshDict).map(v => meshDict[v]);
    this.model.meshes.forEach(m => m.getAllTangents());
    return this.model;
  }
}

export abstract class MaterialParserBase {
  filePath: string;
  materials: Material[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.materials = [];
  }

  // download image file then convert to bitmap
  protected static async fetchImageAsBitmap(filePath: string) {
    const imgRsp = await axios.get(filePath, { responseType: "blob" });
    if (!checkStatus(imgRsp)) return null;
    return await createImageBitmap(imgRsp.data);
  }

  abstract parse(): Promise<Material[]>;
}

// a simple Wavefront MTL file parser
export class MTLMaterialParser extends MaterialParserBase {
  constructor(filePath: string) {
    super(filePath);
  }

  async parse() {
    // download MTL file
    const rsp = await axios.get(this.filePath, { responseType: "text", validateStatus: () => true });
    if (!checkStatus(rsp)) return null;
    // parse MTL file
    const lines = rsp.data.split("\n");
    let curMaterial: Material = null;
    for (let iLine = 0; iLine < lines.length; iLine++) {
      let tokens: string[] = lines[iLine].split(/\s/g);
      tokens = tokens.filter(v => v != "");
      if (tokens.length == 2 && tokens[0] == "newmtl") { // newmtl
        if (curMaterial != null) this.materials.push(curMaterial);
        curMaterial = new Material();
        curMaterial.name = tokens[1];
      } else if (tokens.length == 4 && tokens[0] == "Kd") { // Kd
        vec3.set(curMaterial.albedo, parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
      } else if (tokens.length == 2 && tokens[0] == "map_Kd") { // map_Kd
        const imgPath = combinePath(getDirectoryPath(this.filePath), tokens[1]);
        curMaterial.albedoMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
    }
    if (curMaterial != null) this.materials.push(curMaterial);
    return this.materials;
  }
}

export class MaterialJSONParser extends MaterialParserBase {
  constructor(filePath: string) {
    super(filePath);
  }

  async parse() {
    // download JSON file
    const rsp = await axios.get(this.filePath, { responseType: "text", validateStatus: () => true });
    if (!checkStatus(rsp)) return null;
    // parse JSON file
    const obj = JSON.parse(rsp.data);
    for (let i = 0; i < obj.length; i++) {
      const mObj = obj[i];
      const m = new Material();
      m.name = mObj.name;
      if ("albedo" in mObj) m.albedo = mObj.albedo;
      if ("roughness" in mObj) m.roughness = mObj.roughness;
      if ("metallic" in mObj) m.metallic = mObj.metallic;
      if ("ambientOcc" in mObj) m.ambientOcc = mObj.ambientOcc;
      if ("albedoMap" in mObj) {
        const imgPath = combinePath(getDirectoryPath(this.filePath), mObj.albedoMap);
        m.albedoMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
      if ("roughnessMap" in mObj) {
        const imgPath = combinePath(getDirectoryPath(this.filePath), mObj.roughnessMap);
        m.roughnessMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
      if ("metallicMap" in mObj) {
        const imgPath = combinePath(getDirectoryPath(this.filePath), mObj.metallicMap);
        m.metallicMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
      if ("ambientOccMap" in mObj) {
        const imgPath = combinePath(getDirectoryPath(this.filePath), mObj.ambientOccMap);
        m.ambientOccMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
      if ("normalMap" in mObj) {
        const imgPath = combinePath(getDirectoryPath(this.filePath), mObj.normalMap);
        m.normalMap.data = await MaterialParserBase.fetchImageAsBitmap(imgPath);
      }
      this.materials.push(m);
    }
    return this.materials;
  }
}