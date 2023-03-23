import OBJFile, { type ITextureVertex, type IVertex } from "obj-file-parser-ts";
import axios from "axios";
import { Vertex, Model, Mesh } from "./mesh";
import { Material, MaterialTexture } from "./material";
import { vec3 } from "gl-matrix";
import { checkStatus } from "../util/http";
import { combinePath, getDirectoryPath } from "../util/path";

function makeVertex(position: IVertex, normal: IVertex, texCoord: ITextureVertex): Vertex {
  return {
    position: [position.x, position.y, position.z],
    normal: [normal.x, normal.y, normal.z],
    texCoord: [texCoord.u, texCoord.v],
  };
}

export class OBJModelParser {
  public filePath: string;
  public model: Model = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async parse() {
    const rsp = await axios.get(this.filePath, { responseType: "text" });
    if (!checkStatus(rsp)) return null;
    const objFile = new OBJFile(rsp.data);
    const obj = objFile.parse();
    this.model = new Model();
    for (let i = 0; i < obj.materialLibraries.length; i++) {
      const mtlFilePath = combinePath(getDirectoryPath(this.filePath), obj.materialLibraries[i]);
      const parser = new MTLMaterialParser(mtlFilePath);
      const mats = await parser.parse();
      this.model.materials = this.model.materials.concat(mats);
    }
    const matDict: { [key: string]: Material } = {};
    for (let i = 0; i < this.model.materials.length; i++) {
      matDict[this.model.materials[i].name] = this.model.materials[i];
    }
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
    return this.model;
  }
}

export class MTLMaterialParser {
  public filePath: string;
  public materials: Material[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.materials = [];
  }

  public async parse() {
    const rsp = await axios.get(this.filePath, { responseType: "text" });
    if (!checkStatus(rsp)) return null;
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
        const imgRsp = await axios.get(imgPath, { responseType: "blob" });
        if (!checkStatus(imgRsp)) return null;
        curMaterial.albedoMap = new MaterialTexture();
        curMaterial.albedoMap.data = await createImageBitmap(imgRsp.data);
      }
    }
    if (curMaterial != null) this.materials.push(curMaterial);
    return this.materials;
  }
}