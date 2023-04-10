// editor window base class
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts"

export abstract class EditorWindowBase {
  title: string;

  draw() {
    ImGui.Begin(this.title);
    this.onDraw();
    ImGui.End();
  }

  abstract onDraw(): void;
}