// welcome to pardofelis window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import { EditorWindowBase } from "./window";
import { VERSION } from "../version";

export class WelcomeWindow extends EditorWindowBase {
  constructor() {
    super();
    this.title = "Welcome to Pardofelis Pipeline";
  }

  onDraw() {
    ImGui.Text("Version: " + VERSION);
    ImGui.Text("ImGui Version: " + ImGui.VERSION);
  }
}