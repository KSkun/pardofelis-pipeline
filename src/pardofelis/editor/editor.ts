// pardofelis editor
// by chengtian.he
// 2023.4.9

import { ImGui, ImGui_Impl } from "@zhobo63/imgui-ts";
import type { Scene } from "../scene/scene";
import type { EditorWindowBase } from "./window";
import { SceneWindow } from "./scene";
import { WelcomeWindow } from "./welcome";

export class PardofelisEditor {
  canvas: HTMLCanvasElement;
  scene: Scene;
  windows: EditorWindowBase[] = [];

  isInit: boolean = false;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
    this.addWindows();
  }

  private addWindows() {
    this.windows.push(new WelcomeWindow(this));
    this.windows.push(new SceneWindow(this));
  }

  async init() {
    await ImGui.default();
    ImGui.CHECKVERSION();
    ImGui.CreateContext();
    const io = ImGui.GetIO();
    ImGui.StyleColorsDark();
    io.Fonts.AddFontDefault();

    this.canvas.getContext("webgl2", { alpha: true }); // force imgui to use a context with alpha
    ImGui_Impl.Init(this.canvas);
    this.isInit = true;
  }

  renderOneFrame(time: number) {
    ImGui_Impl.NewFrame(time);
    ImGui.NewFrame();
    this.windows.forEach(w => w.draw());
    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.ClearBuffer(new ImGui.ImVec4(0, 0, 0, 0));
    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
  }
}