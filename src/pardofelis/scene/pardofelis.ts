// sample scenes for Pardofelis demo
// by chengtian.he
// 2023.3.28

import { mat4 } from "gl-matrix";

import { PerspectiveCamera } from "../camera/perspective";
import { OBJModelParser } from "../mesh/obj_parser";
import { HDRColor } from "../util/color";
import { PointLight } from "./light";
import { Scene } from "./scene";

export async function getPardofelisDemoScene(aspectRatio: number) {
  const scene = new Scene();

  const camera = new PerspectiveCamera([10, 0, -15], [0, 0, 1], null, 80, aspectRatio);
  scene.camera = camera;

  scene.lights.add(new PointLight([4, 0, 0], new HDRColor([0, 0, 1], 3)));
  scene.lights.add(new PointLight([0, 0, 0], new HDRColor([1, 1, 0], 3)));
  scene.lights.add(new PointLight([15, 0, -15], new HDRColor([1, 1, 1], 3)));

  const mtxId = mat4.create();
  mat4.identity(mtxId);

  const cubeModelParser = new OBJModelParser("/resources/simple_cube/simple_cube.obj");
  const cubeModel = await cubeModelParser.parse();
  scene.models.add("cube1", cubeModel, [0, 5, 0], [0, 0, 0], [1, 1, 1]);
  scene.models.add("cube2", cubeModel, [0, -5, 0], [0, 0, 0], [1, 1, 1]);

  const planeModelParser = new OBJModelParser("/resources/simple_plane/simple_plane.obj");
  const planeModel = await planeModelParser.parse();
  scene.models.add("floor", planeModel, [-1, 0, 0], [0, 0, -90], [20, 1, 20]);

  const lumineModelParser = new OBJModelParser("/resources/lumine/Lumine.obj");
  const lumineModel = await lumineModelParser.parse();
  scene.models.add("lumine", lumineModel, [0, 0, 0], [0, 180, -90], [1, 1, 1]);

  const gameboyModelParser = new OBJModelParser("/resources/gameboy/SM_Gameboy.obj");
  const gameboyModel = await gameboyModelParser.parse();
  scene.models.add("gameboy", gameboyModel, [5, -10, 0], [90, 90, 0], [3, 3, 3]);

  return scene;
}