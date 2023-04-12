// welcome to pardofelis window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import { EditorWindowBase } from "./window";
import { VERSION } from "../version";
import { PardofelisEditor } from "./editor";

export class WelcomeWindow extends EditorWindowBase {
  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Welcome to Pardofelis Pipeline";
    this.anchor = "left-upper";
    this.position = [50, 50];
    this.size = [250, 100];
  }

  onDraw() {
    ImGui.Text("Version: " + VERSION);
    ImGui.Text("ImGui Version: " + ImGui.VERSION);
  }
}