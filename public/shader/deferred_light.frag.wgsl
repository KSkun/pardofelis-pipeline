// light pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "postprocess.h.wgsl"
#include "material.h.wgsl"
#include "lighting.h.wgsl"

#define BGID_SCENE 0
#define BGID_GBUFFER 1
#define BGID_SCREEN 2
#define BGID_LIGHT 2

#include "u_scene.h.wgsl"
#include "u_gbuffer.h.wgsl"
#include "u_screen.h.wgsl"
#include "u_light.h.wgsl"

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> @location(0) vec4<f32> {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));
  var fbColor = textureLoad(screenFrameBuffer, screenPosInt2, 0);

  var worldPos4 = textureLoad(gBufWorldPos, screenPosInt2, 0);
  if (worldPos4.w == 0.0) { discard; } // flag value for skip pixels
  var worldPos = worldPos4.xyz;

  var matParam : MaterialParam;
  matParam.albedo = textureLoad(gBufAlbedo, screenPosInt2, 0).rgb;
  var rmao = textureLoad(gBufRMAO, screenPosInt2, 0);
  matParam.roughness = rmao.r;
  matParam.metallic = rmao.g;
  matParam.ambientOcc = rmao.b;

  var mappedNormal = textureLoad(gBufNormal, screenPosInt2, 0).xyz * 2.0 - 1.0;

  var lightResult = fbColor.rgb;

#if POINT_LIGHT_PASS
  // point light
  var lightViewPos = worldPos - lightParam.worldPos;
  var shadowResult = testPointLightDepthMapPCF(normalize(lightViewPos), length(lightViewPos));
  lightResult += shadowResult * getPointLightResult(worldPos, mappedNormal, sceneInfo.cameraPos, matParam, lightParam);
#endif

#if DIR_LIGHT_PASS
  // directional light
  var lightViewPos = worldPos - lightParam.worldPos;
  var shadowResult = testDirLightDepthMapPCF(worldPos, length(lightViewPos));
  lightResult += shadowResult * getDirLightResult(worldPos, mappedNormal, sceneInfo.cameraPos, matParam, lightParam);
#endif

#if AMBIENT_PASS
  // ambient
  lightResult += getAmbientResult(matParam, sceneInfo.ambient);
#endif

  return vec4<f32>(lightResult, 1.0);
}