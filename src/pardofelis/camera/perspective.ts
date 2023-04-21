// perpective projected camera
// by chengtian.he
// 2023.2.28

import { vec3, mat4 } from "gl-matrix";
import { ImGui } from "@zhobo63/imgui-ts";

import { Camera } from "./camera";
import { EditorUtil } from "../editor/util";

export class PerspectiveCamera extends Camera {
  // perspective param
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(
    position: vec3, front: vec3, up?: vec3,
    fov: number = 60, aspect: number = 1, near: number = 0.01, far: number = 1000
  ) {
    super(position, front, up);
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }

  getProjMatrix() {
    const result = mat4.create();
    // use perspectiveZO for WebGPU's NDC coord system
    mat4.perspectiveZO(result, this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    return result;
  }

  onDrawInspector() {
    let isCameraChanged = false;

    ImGui.LabelText("Type", "Perspective");
    let inputPosition = [this.position[0], this.position[1], this.position[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isCameraChanged;
    let inputFront = [this.front[0], this.front[1], this.front[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Front", inputFront, input => this.front = input) || isCameraChanged;
    let inputUp = [this.up[0], this.up[1], this.up[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Up", inputUp, input => this.up = input) || isCameraChanged;
    let inputRight = [this.right[0], this.right[1], this.right[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Right", inputRight, input => this.right = input) || isCameraChanged;
    let inputFov = [this.fov];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "FoV", inputFov, input => this.fov = input[0]) || isCameraChanged;
    let inputNear = [this.near];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Near", inputNear, input => this.near = input[0]) || isCameraChanged;
    let inputFar = [this.far];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Far", inputFar, input => this.far = input[0]) || isCameraChanged;

    if (isCameraChanged) this.checkParams();

    return false;
  }

  toJSON() {
    const o = super.toJSON();
    o.type = "perspective";
    o.front = [this.front[0], this.front[1], this.front[2]];
    o.up = [this.up[0], this.up[1], this.up[2]];
    o.fov = this.fov;
    o.near = this.near;
    o.far = this.far;
    return o;
  }

  static fromJSON(o: any, aspect: number) {
    return new PerspectiveCamera(o.position, o.front, o.up, o.fov, aspect, o.near, o.far);
  }
}