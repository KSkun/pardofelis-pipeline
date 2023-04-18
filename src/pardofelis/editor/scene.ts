// scene list window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import { EditorWindowBase } from "./window";
import type { Scene } from "../scene/scene";
import { EventType } from "./event";
import { PardofelisEditor } from "./editor";

export class SceneWindow extends EditorWindowBase {
  scene: Scene;
  selectedObject: any;

  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Scene List";
    this.anchor = "left-upper";
    this.position = [50, 300];
    this.size = [250, 200];
    this.scene = this.owner.scene;
  }

  private drawSelectable(name: string, obj: any) {
    if (ImGui.Selectable(name, this.selectedObject == obj)) {
      this.selectedObject = obj;
      this.owner.eventMgr.fire(EventType.SceneListSelectedChange, { name: name, obj: this.selectedObject });
    }
  }

  onDraw() {
    // camera
    this.drawSelectable("Camera", this.scene.camera);
    // light
    for (let i = 0; i < this.scene.lights.pointLights.length; i++) {
      const pl = this.scene.lights.pointLights[i];
      this.drawSelectable("PointLight #" + (i + 1), pl);
    }
    // model
    for (let i = 0; i < this.scene.models.models.length; i++) {
      const m = this.scene.models.models[i];
      this.drawSelectable("Model " + m.name, m);
    }
  }
}