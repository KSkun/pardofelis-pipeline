// PBR lighting fragment shader
// by chengtian.he
// 2023.3.1

#include "postprocess.h.wgsl"
#include "lighting.h.wgsl"

#define BGID_MATERIAL 1
#define BGID_SCENE 2
#define BGID_SCREEN 3
#define BGID_LIGHT 3

#include "u_material.h.wgsl"
#include "u_scene.h.wgsl"
#include "u_screen.h.wgsl"
#include "u_light.h.wgsl"

@fragment
fn main(
  @builtin(position) screenPos : vec4<f32>,
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>
) -> @location(0) vec4<f32> {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));
  var fbColor = textureLoad(screenFrameBuffer, screenPosInt2, 0);
  var matParam = getMatParam(texCoord);
  var mappedNormal = getNormal(normal, tangent, texCoord);

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
  // var shadowResult = testDirLightDepthMapPCF(worldPos, length(lightViewPos));
  var shadowResult = 1.0;
  lightResult += shadowResult * getDirLightResult(worldPos, mappedNormal, sceneInfo.cameraPos, matParam, lightParam);
#endif

#if AMBIENT_PASS
  // ambient
  lightResult += getAmbientResult(matParam, sceneInfo.ambient);
#endif

  return vec4<f32>(lightResult, 1.0);
}