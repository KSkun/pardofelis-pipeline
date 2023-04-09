import { ImGui, ImGui_Impl } from "@zhobo63/imgui-ts";
import type { Scene } from "../scene/scene";

export class PardofelisEditor {
  canvas: HTMLCanvasElement;
  scene: Scene;

  isInit: boolean = false;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
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
    ImGui_Impl.ClearBuffer(new ImGui.ImVec4(0, 0, 0, 0));
    this.isInit = true;
  }

  renderOneFrame(time: number) {
    ImGui_Impl.NewFrame(time);
    ImGui.NewFrame();
    ImGui.Begin("Hello");
    ImGui.Text("Version " + ImGui.VERSION);
    ImGui.End();
    ImGui.EndFrame();
    ImGui.Render();

    ImGui_Impl.ClearBuffer(new ImGui.ImVec4(0, 0, 0, 0));
    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());
  }
}