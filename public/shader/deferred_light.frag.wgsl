// light pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "postprocess.h.wgsl"
#include "material.h.wgsl"
#include "lighting.h.wgsl"

#define BGID_SCENE 0
#define BGID_GBUFFER 1

#include "u_scene.h.wgsl"
#include "u_gbuffer.h.wgsl"

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> @location(0) vec4<f32> {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));

  var worldPos4 = textureLoad(gBufWorldPos, screenPosInt2, 0);
  var worldPos = worldPos4.xyz;
  var normal = textureLoad(gBufNormal, screenPosInt2, 0).xyz * 2.0 - 1.0;
  var albedo = textureLoad(gBufAlbedo, screenPosInt2, 0).rgb;
  var rmao = textureLoad(gBufRMAO, screenPosInt2, 0).rgb;

  // flag value for skip pixels
  if (worldPos4.w == 0.0) {
    discard;
  }

  var matParam : MaterialParam;
  matParam.albedo = albedo;
  matParam.roughness = rmao.r;
  matParam.metallic = rmao.g;
  matParam.ambientOcc = rmao.b;

  var lightResult = vec3<f32>(0.0, 0.0, 0.0);
  for (var i : u32 = 0; i < pointLights.size; i++) {
    var lightParam = pointLights.arr[i];
    var lightViewPos = worldPos - lightParam.worldPos;
    var shadowResult = testPointLightDepthMapPCF(i, normalize(lightViewPos), length(lightViewPos));
    lightResult += shadowResult * getPointLightResult(worldPos, normal, sceneInfo.cameraPos, matParam, lightParam);
  }
  lightResult += getAmbientResult(matParam, sceneInfo.ambient);
  var mappedColor = mapTone(lightResult);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, 1.0);
}