// pardofelis editor
// by chengtian.he
// 2023.4.9

import { ImGui, ImGui_Impl } from "@zhobo63/imgui-ts";
import type { Scene } from "../scene/scene";
import type { EditorWindowBase } from "./window";
import { SceneWindow } from "./scene";
import { WelcomeWindow } from "./welcome";
import { EventManager } from "./event";
import { InspectorWindow } from "./inspector";
import { EventType } from "./event";
import { PipelineBase } from "../pipeline";

export class PardofelisEditor {
  canvas: HTMLCanvasElement;
  realScreenSize: [number, number];
  pipeline: PipelineBase;
  scene: Scene;
  windows: EditorWindowBase[] = [];
  eventMgr: EventManager = new EventManager();

  isInit: boolean = false;

  constructor(canvas: HTMLCanvasElement, pipeline: PipelineBase, realScreenSize: [number, number]) {
    this.canvas = canvas;
    this.pipeline = pipeline;
    this.scene = this.pipeline.scene;
    this.realScreenSize = realScreenSize;
    this.addWindows();

    this.eventMgr.addListener(EventType.SceneChanged, param => this.onSceneChanged(param));
  }

  private addWindows() {
    this.windows.push(new WelcomeWindow(this));
    this.windows.push(new SceneWindow(this));
    this.windows.push(new InspectorWindow(this));
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

  private onSceneChanged(param: any) {
    this.pipeline.scene.toBindGroup(this.pipeline.sceneUniform.bgScene, this.pipeline.device);
    this.pipeline.sceneUniform.bufferMgr.writeBuffer(this.pipeline.device);
  }
}