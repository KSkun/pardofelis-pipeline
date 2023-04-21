// orthographic projected camera
// by chengtian.he
// 2023.4.20

import { vec3, mat4 } from "gl-matrix";
import { ImGui } from "@zhobo63/imgui-ts";

import { Camera } from "./camera";
import { EditorUtil } from "../editor/util";

export class OrthographicCamera extends Camera {
  // orthographic param
  leftBound: number;
  rightBound: number;
  aspect: number;
  nearBound: number;
  farBound: number;

  constructor(
    position: vec3, front: vec3,
    left: number, right: number, aspect: number,
    up?: vec3, near: number = 0.01, far: number = 1000,
  ) {
    super(position, front, up);
    this.leftBound = left;
    this.rightBound = right;
    this.aspect = aspect;
    this.nearBound = near;
    this.farBound = far;
  }

  getProjMatrix() {
    const result = mat4.create();
    // use orthoZO for WebGPU's NDC coord system
    mat4.orthoZO(result, this.leftBound, this.rightBound, this.leftBound / this.aspect, this.rightBound / this.aspect, this.nearBound, this.farBound);
    return result;
  }

  onDrawInspector() {
    let isCameraChanged = false;

    ImGui.LabelText("Type", "Orthographic");
    let inputPosition = [this.position[0], this.position[1], this.position[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Position", inputPosition, input => this.position = input) || isCameraChanged;
    let inputFront = [this.front[0], this.front[1], this.front[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Front", inputFront, input => this.front = input) || isCameraChanged;
    let inputUp = [this.up[0], this.up[1], this.up[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Up", inputUp, input => this.up = input) || isCameraChanged;
    let inputRight = [this.right[0], this.right[1], this.right[2]];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat3, "Right", inputRight, input => this.right = input) || isCameraChanged;
    ImGui.Text("Bounds");
    let inputLeft = [this.leftBound];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Left", inputLeft, input => this.leftBound = input[0]) || isCameraChanged;
    let inputRightB = [this.rightBound];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Right", inputRightB, input => this.rightBound = input[0]) || isCameraChanged;
    let inputNear = [this.nearBound];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Near", inputNear, input => this.nearBound = input[0]) || isCameraChanged;
    let inputFar = [this.farBound];
    isCameraChanged = EditorUtil.drawField(ImGui.InputFloat, "Far", inputFar, input => this.farBound = input[0]) || isCameraChanged;

    if (isCameraChanged) this.checkParams();

    return false;
  }

  toJSON() {
    const o = super.toJSON();
    o.type = "orthographic";
    o.front = [this.front[0], this.front[1], this.front[2]];
    o.up = [this.up[0], this.up[1], this.up[2]];
    o.leftBound = this.leftBound;
    o.rightBound = this.rightBound;
    o.aspect = this.aspect;
    o.nearBound = this.nearBound;
    o.farBound = this.farBound;
    return o;
  }

  static fromJSON(o: any) {
    return new OrthographicCamera(o.position, o.front, o.leftBound, o.rightBound, o.aspect, o.up, o.nearBound, o.farBound);
  }
}