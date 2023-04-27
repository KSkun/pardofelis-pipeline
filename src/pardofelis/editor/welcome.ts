// welcome to pardofelis window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import { EditorWindowBase } from "./window";
import { VERSION } from "../version";
import { PardofelisEditor } from "./editor";
import { EditorUtil } from "./util";
import { EventType } from "./event";

export class WelcomeWindow extends EditorWindowBase {
  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Welcome to Pardofelis Pipeline";
    this.position = [50, 50];
    this.anchor = "left-upper";
    this.size = [250, 200];
  }

  onDraw() {
    ImGui.Text("Version: " + VERSION);
    ImGui.Text("ImGui Version: " + ImGui.VERSION);
    let isConfigChanged = false;
    const config = this.owner.config;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "Normal Map", [config.enableNormalMapping], input => config.enableNormalMapping = input[0]) || isConfigChanged;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "Shadow", [config.enableShadowMapping], input => config.enableShadowMapping = input[0]) || isConfigChanged;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "Shadow Anti-Alias", [config.enableShadowPCF], input => config.enableShadowPCF = input[0]) || isConfigChanged;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "Instance", [config.enableInstance], input => config.enableInstance = input[0]) || isConfigChanged;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "Static Batching", [config.enableStaticBatching], input => config.enableStaticBatching = input[0]) || isConfigChanged;
    isConfigChanged = EditorUtil.drawField(ImGui.Checkbox, "HDR Tone Mapping", [config.enableToneMapping], input => config.enableToneMapping = input[0]) || isConfigChanged;
    if (isConfigChanged) this.owner.eventMgr.fire(EventType.PipelineConfigChanged);
  }
}