// scene object inspector window
// by chengtian.he
// 2023.4.10

import { EditorWindowBase } from "./window";
import { PardofelisEditor } from "./editor";
import { EventType } from "./event";
import { ImGui } from "@zhobo63/imgui-ts";

export interface IInspectorDrawable {
  onDrawInspector(inspector: InspectorWindow): void;
}

export class InspectorWindow extends EditorWindowBase {
  selectedObject: any;
  isSceneChanged: boolean = false;

  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Inspector";
    this.anchor = "right-upper";
    this.position = [-450, 50];
    this.size = [400, 350];
    this.selectedObject = null;

    this.owner.eventMgr.addListener(EventType.SceneListSelectedChange, param => this.onSceneListSelectedChange(param));
  }

  private onSceneListSelectedChange(param: any) {
    this.selectedObject = param;
  }

  onDraw() {
    if (this.selectedObject != null) {
      ImGui.LabelText("Name", this.selectedObject.name);
      if (this.selectedObject.obj.onDrawInspector != undefined) {
        if (this.selectedObject.obj.onDrawInspector(this)) this.owner.eventMgr.fire(EventType.SceneChanged);
      }
    }
  }
}