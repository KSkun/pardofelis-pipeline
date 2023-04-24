// sample scenes for Pardofelis demo
// by chengtian.he
// 2023.3.28

import { mat4 } from "gl-matrix";

import { PerspectiveCamera } from "../camera/perspective";
// import { OrthographicCamera } from "../camera/orthographic";
import { OBJModelParser } from "../mesh/obj_parser";
import { HDRColor } from "../util/color";
import { DirectionalLight, PointLight } from "./light";
import { Scene } from "./scene";

export async function getPardofelisDemoScene(aspectRatio: number) {
  const scene = new Scene();

  scene.info.ambient = [0.1, 0.1, 0.1];

  const camera = new PerspectiveCamera([-18, 10, 0], [1, 0, 0], [0, 1, 0], 80, aspectRatio);
  // const camera = new OrthographicCamera([-18, 10, 0], [1, 0, 0], -22, 22, aspectRatio);
  scene.camera = camera;

  scene.lights.add(new PointLight([-3, 4, 0], new HDRColor([0, 0, 1], 1)));
  scene.lights.add(new PointLight([-3, 0.1, 0], new HDRColor([1, 1, 0], 1)));
  scene.lights.add(new PointLight([-2.5, 11, 5], new HDRColor([1, 1, 1], 2)));
  scene.lights.add(new DirectionalLight([-30, 30, -30], new HDRColor([1, 1, 1], 0.3), [1, -1, 1]));

  const mtxId = mat4.create();
  mat4.identity(mtxId);

  const cubeModelParser = new OBJModelParser("/resources/simple_cube/simple_cube.obj");
  const cubeModel = await cubeModelParser.parse();
  const cubeModelInfo = scene.models.add(cubeModel);
  cubeModelInfo.addInstance("cube1", [-3, 2, 3], [0, 0, 0], [1, 1, 1]);
  cubeModelInfo.addInstance("cube2", [-3, 2, -3], [0, 0, 0], [1, 1, 1]);

  const planeModelParser = new OBJModelParser("/resources/simple_plane/simple_plane.obj");
  const planeModel = await planeModelParser.parse();
  const planeModelInfo = scene.models.add(planeModel);
  planeModelInfo.addInstance("floor", [0, 0, 0], [0, 0, 0], [20, 1, 20]);

  const lumineModelParser = new OBJModelParser("/resources/lumine/Lumine.obj");
  const lumineModel = await lumineModelParser.parse();
  const lumineModelInfo = scene.models.add(lumineModel);
  lumineModelInfo.addInstance("lumine", [0, 0, 0], [0, -90, 0], [1, 1, 1]);

  const gameboyModelParser = new OBJModelParser("/resources/gameboy/SM_Gameboy.obj");
  const gameboyModel = await gameboyModelParser.parse();
  const gameboyModelInfo = scene.models.add(gameboyModel);
  gameboyModelInfo.addInstance("gameboy", [-1, 5, -10], [0, 180, 0], [3, 3, 3]);

  return scene;
}