import { mat4 } from "gl-matrix";
import { PerspectiveCamera } from "../camera/perspective";
import { OBJModelParser } from "../mesh/obj_parser";
import { HDRColor } from "../util/color";
import { getUnitCubeModel } from "../util/unit_cube";
import { PointLight } from "./light";
import { Scene } from "./scene";

export async function getPardofelisDemoScene(aspectRatio: number) {
  const scene = new Scene();

  const camera = PerspectiveCamera.create([10, 0, -15], [0, 0, 1], null, 80, aspectRatio);
  scene.camera = camera;

  scene.lights.add(new PointLight([2, 0, 0], new HDRColor([0, 0, 1], 3)));
  scene.lights.add(new PointLight([-2, 0, 0], new HDRColor([1, 1, 0], 3)));
  scene.lights.add(new PointLight([15, 0, -15], new HDRColor([1, 1, 1], 3)));

  const mtxId = mat4.create();
  mat4.identity(mtxId);

  const unitCubeModel = getUnitCubeModel();
  const mtxCube1 = mat4.create();
  mat4.translate(mtxCube1, mtxId, [0, 5, 0]);
  scene.models.add("cube1", unitCubeModel, mtxCube1);
  const mtxCube2 = mat4.create();
  mat4.translate(mtxCube2, mtxId, [0, -5, 0]);
  scene.models.add("cube2", unitCubeModel, mtxCube2);

  const lumineModelParser = new OBJModelParser("resources/lumine/Lumine.obj");
  const lumineModel = await lumineModelParser.parse();
  const mtxLumine = mat4.create();
  mat4.rotateY(mtxLumine, mtxId, Math.PI);
  mat4.rotateZ(mtxLumine, mtxLumine, Math.PI / 2);
  scene.models.add("lumine", lumineModel, mtxLumine);

  return scene;
}