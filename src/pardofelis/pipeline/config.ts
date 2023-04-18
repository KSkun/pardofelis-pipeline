import type { ShaderMacroDefintionList } from "./shader_preprocess";

export class PardofelisPipelineConfig {
  enableNormalMapping: boolean = true;
  enableShadowMapping: boolean = true;
  enableShadowPCF: boolean = true;

  getPredefinedMacros() {
    const macro: ShaderMacroDefintionList = {};
    if (this.enableNormalMapping) macro["ENABLE_NORMAL_MAP"] = "1";
    if (this.enableShadowMapping) macro["ENABLE_SHADOW_MAP"] = "1";
    if (this.enableShadowPCF) macro["ENABLE_SHADOW_PCF"] = "1";
    return macro;
  }
}