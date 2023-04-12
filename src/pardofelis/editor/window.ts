// editor window base class
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts"
import { PardofelisEditor } from "./editor";

export type EditorWindowAnchor = "left-upper" | "left-lower" | "right-upper" | "right-lower";

function getAbsolutePosition(relPos: [number, number], anchor: EditorWindowAnchor, screenSize: [number, number]) {
  let anchorPos: [number, number];
  if (anchor == "left-upper") anchorPos = [0, 0];
  else if (anchor == "left-lower") anchorPos = [0, screenSize[1]];
  else if (anchor == "right-upper") anchorPos = [screenSize[0], 0];
  else if (anchor == "right-lower") anchorPos = screenSize;
  return [anchorPos[0] + relPos[0], anchorPos[1] + relPos[1]];
}

export abstract class EditorWindowBase {
  owner: PardofelisEditor;
  title: string;
  position: [number, number];
  anchor: EditorWindowAnchor;
  size: [number, number];

  isSizeSet: boolean = false;

  constructor(owner: PardofelisEditor) {
    this.owner = owner;
  }

  draw() {
    if (!this.isSizeSet) {
      let posTuple = getAbsolutePosition(this.position, this.anchor, this.owner.realScreenSize);
      let pos = new ImGui.Vec2(posTuple[0], posTuple[1]);
      ImGui.SetNextWindowPos(pos);
      let size = new ImGui.Vec2(this.size[0], this.size[1]);
      ImGui.SetNextWindowSize(size);
      this.isSizeSet = true;
    }
    ImGui.Begin(this.title);
    this.onDraw();
    ImGui.End();
  }

  abstract onDraw(): void;
}