// editor window base class
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts"
import { PardofelisEditor } from "./editor";

export type EditorWindowAnchor = "left-upper" | "right-upper" | "left-lower" | "right-lower";

function getAbsolutePosition(relPos: [number, number], anchor: EditorWindowAnchor, screenSize: [number, number]): [number, number] {
  let anchorPos: [number, number];
  if (anchor == "left-lower") anchorPos = [0, screenSize[1]];
  else if (anchor == "left-upper") anchorPos = [0, 0];
  else if (anchor == "right-lower") anchorPos = screenSize;
  else if (anchor == "right-upper") anchorPos = [screenSize[0], 0];
  else return [0, 0];
  return [anchorPos[0] + relPos[0], anchorPos[1] + relPos[1]];
}

export abstract class EditorWindowBase {
  owner: PardofelisEditor;
  title: string;
  anchor: EditorWindowAnchor;
  position: [number, number];
  size: [number, number];

  isSizeSet: boolean = false;
  
  constructor(owner: PardofelisEditor) {
    this.owner = owner;
  }

  draw() {
    if (!this.isSizeSet) {
      let posTuple = getAbsolutePosition(this.position, this.anchor, [this.owner.canvas.width, this.owner.canvas.height]);
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