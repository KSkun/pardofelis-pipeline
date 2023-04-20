// PBR lighting fragment shader
// by chengtian.he
// 2023.3.1

#include "postprocess.h.wgsl"
#include "lighting.h.wgsl"

#define BGID_MATERIAL 1
#define BGID_SCENE 2

#include "u_material.h.wgsl"
#include "u_scene.h.wgsl"

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>
) -> @location(0) vec4<f32> {
  var matParam = getMatParam(texCoord);
  var mappedNormal = getNormal(normal, tangent, texCoord);
  var lightResult = vec3<f32>(0.0, 0.0, 0.0);
  for (var i : u32 = 0u; i < pointLights.size; i++) {
    var lightParam = pointLights.arr[i];
    var lightViewPos = worldPos - lightParam.worldPos;
    var shadowResult = testPointLightDepthMapPCF(i, normalize(lightViewPos), length(lightViewPos));
    lightResult += shadowResult * getPointLightResult(worldPos, mappedNormal, sceneInfo.cameraPos, matParam, lightParam);
  }
  lightResult += getAmbientResult(matParam, sceneInfo.ambient);
  var mappedColor = mapTone(lightResult);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, 1.0);
}