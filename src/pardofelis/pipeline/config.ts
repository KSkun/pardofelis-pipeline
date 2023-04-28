import type { ShaderMacroDefintionList } from "./shader_preprocess";

export class PardofelisPipelineConfig {
  hideEditorWindows: boolean = false;
  enableNormalMapping: boolean = true;
  enableShadowMapping: boolean = true;
  enableShadowPCF: boolean = true;
  enableInstance: boolean = true;
  enableStaticBatching: boolean = true;
  enableToneMapping: boolean = true;
  enableEarlyZTest: boolean = true;
  enableOcclusionCulling: boolean = true;

  getPredefinedMacros() {
    const macro: ShaderMacroDefintionList = {};
    if (this.enableNormalMapping) macro["ENABLE_NORMAL_MAP"] = "1";
    if (this.enableShadowMapping) macro["ENABLE_SHADOW_MAP"] = "1";
    if (this.enableShadowPCF) macro["ENABLE_SHADOW_PCF"] = "1";
    if (this.enableToneMapping) macro["ENABLE_TONE_MAPPING"] = "1";
    if (this.enableEarlyZTest) macro["ENABLE_EARLY_Z"] = "1";
    return macro;
  }

  static fromLocalStorage() {
    const r = new PardofelisPipelineConfig();
    const jsonStr = localStorage.getItem("pardofelis_config");
    if (jsonStr != null) {
      const o = JSON.parse(jsonStr);
      r.hideEditorWindows = o["hideEditorWindows"];
      r.enableNormalMapping = o["enableNormalMapping"];
      r.enableShadowMapping = o["enableShadowMapping"];
      r.enableShadowPCF = o["enableShadowPCF"];
      r.enableInstance = o["enableInstance"];
      r.enableStaticBatching = o["enableStaticBatching"];
      r.enableToneMapping = o["enableToneMapping"];
      r.enableEarlyZTest = o["enableEarlyZTest"];
      r.enableOcclusionCulling = o["enableOcclusionCulling"];
    }
    return r;
  }

  toLocalStorage() {
    localStorage.setItem("pardofelis_config", JSON.stringify(this));
  }
}