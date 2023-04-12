// scene list window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import { EditorWindowBase } from "./window";
import type { Scene } from "../scene/scene";
import { PardofelisEditor } from "./editor";

export class SceneWindow extends EditorWindowBase {
  scene: Scene;
  selectedObject: any;

  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Scene List";
    this.anchor = "left-upper";
    this.position = [50, 200];
    this.size = [250, 200];
    this.scene = this.owner.scene;
  }

  onDraw() {
    ImGui.BeginChild("SceneList");
    // camera
    if (ImGui.Selectable("Camera", this.selectedObject == this.scene.camera)) this.selectedObject = this.scene.camera;
    // light
    for (let i = 0; i < this.scene.lights.pointLights.length; i++) {
      const pl = this.scene.lights.pointLights[i];
      if (ImGui.Selectable("PointLight #" + (i + 1), this.selectedObject == pl)) this.selectedObject = pl;
    }
    // model
    for (let i = 0; i < this.scene.models.models.length; i++) {
      const m = this.scene.models.models[i];
      if (ImGui.Selectable("Model " + m.name, this.selectedObject == m)) this.selectedObject = m;
    }
    ImGui.EndChild();
  }
}