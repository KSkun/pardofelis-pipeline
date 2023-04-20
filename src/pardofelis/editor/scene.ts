// scene list window
// by chengtian.he
// 2023.4.10

import { ImGui } from "@zhobo63/imgui-ts";
import axios from "axios";
import { saveAs } from "file-saver";

import { EditorWindowBase } from "./window";
import { EventType } from "./event";
import { PardofelisEditor } from "./editor";
import { Scene } from "../scene/scene";
import { getPardofelisDemoScene } from "../scene/pardofelis";

export class SceneWindow extends EditorWindowBase {
  selectedObject: any;

  inputRemoteFilePath: [string] = [""];

  constructor(owner: PardofelisEditor) {
    super(owner);
    this.title = "Scene List";
    this.anchor = "left-upper";
    this.position = [50, 300];
    this.size = [250, 300];
    this.hasMenuBar = true;

    this.owner.eventMgr.addListener(EventType.SceneChanged, async param => await this.onSceneChanged(param));
  }

  private drawSelectable(name: string, obj: any) {
    if (ImGui.Selectable(name, this.selectedObject == obj)) {
      this.selectedObject = obj;
      this.owner.eventMgr.fire(EventType.SceneListSelectedChange, { name: name, obj: this.selectedObject });
    }
  }

  onDraw() {
    this.onDrawMenuBar();
    // camera
    this.drawSelectable("Camera", this.owner.scene.camera);
    // light
    for (let i = 0; i < this.owner.scene.lights.pointLights.length; i++) {
      const pl = this.owner.scene.lights.pointLights[i];
      this.drawSelectable("PointLight #" + (i + 1), pl);
    }
    // model
    for (let i = 0; i < this.owner.scene.models.models.length; i++) {
      const m = this.owner.scene.models.models[i];
      this.drawSelectable("Model " + m.name, m);
    }
  }

  private onDrawMenuBar() {
    let willOpenRemoteSceneInputDialog = false;
    if (ImGui.BeginMenuBar()) {
      if (ImGui.BeginMenu("File")) {
        if (ImGui.MenuItem("Open Sample")) this.onOpenSampleScene();
        if (ImGui.MenuItem("Open Local")) this.onOpenLocalScene();
        if (ImGui.MenuItem("Open Remote")) willOpenRemoteSceneInputDialog = true;
        if (ImGui.MenuItem("Save")) this.onSaveScene();
        ImGui.EndMenu();
      }
      ImGui.EndMenuBar();
    }
    if (willOpenRemoteSceneInputDialog) ImGui.OpenPopup("OpenRemoteScene");
    this.drawRemoteSceneInputDialog();
  }

  private onSaveScene() {
    const o = this.owner.pipeline.scene.toJSON();
    const jsonStr = JSON.stringify(o, undefined, 2);
    saveAs(new Blob([jsonStr]), "scene.json");
  }

  private async onOpenSampleScene() {
    this.owner.pipeline.scene = await getPardofelisDemoScene(this.owner.pipeline.getAspect());
    this.owner.pipeline.scene.createGPUObjects(this.owner.pipeline.device);
    this.owner.eventMgr.fire(EventType.SceneChanged);
  }

  private onOpenLocalScene() {
    const inputEle = document.createElement("input");
    inputEle.type = "file";
    inputEle.onchange = async () => {
      const file = inputEle.files[0];
      const jsonStr = await file.text();
      const o = JSON.parse(jsonStr);
      if (o != null) {
        this.owner.pipeline.scene = await Scene.fromJSON(o, this.owner.pipeline.getAspect());
        this.owner.pipeline.scene.createGPUObjects(this.owner.pipeline.device);
        this.owner.eventMgr.fire(EventType.SceneChanged);
      }
    };
    inputEle.click();
  }

  private async onOpenRemoteScene() {
    const filePath = this.inputRemoteFilePath[0];
    const rsp = await axios.get(filePath, { responseType: "text" });
    const o = JSON.parse(rsp.data);
    if (o != null) {
      this.owner.pipeline.scene = await Scene.fromJSON(o, this.owner.pipeline.getAspect());
      this.owner.pipeline.scene.createGPUObjects(this.owner.pipeline.device);
      this.owner.eventMgr.fire(EventType.SceneChanged);
    }
  }

  private drawRemoteSceneInputDialog() {
    if (ImGui.BeginPopup("OpenRemoteScene")) {
      ImGui.InputText("Remote File Path", this.inputRemoteFilePath);
      if (ImGui.Button("OK")) {
        this.onOpenRemoteScene();
        ImGui.CloseCurrentPopup();
      }
      ImGui.SameLine();
      if (ImGui.Button("Cancel")) {
        ImGui.CloseCurrentPopup();
      }
      ImGui.EndPopup();
    }
  }

  private async onSceneChanged(param: any) {
    this.selectedObject = null;
  }
}