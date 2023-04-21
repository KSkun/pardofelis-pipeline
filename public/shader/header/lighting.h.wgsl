// lighting functions
// by chengtian.he
// 2023.4.20

#include "pbr.h.wgsl"
#include "math.h.wgsl"
#include "lights.h.wgsl"

fn getPointLightRadiance(param : PointLightParam, worldPos : vec3<f32>) -> vec3<f32> {
  var lightDist = length(param.worldPos - worldPos);
  var attenuation = 1.0 / (lightDist * lightDist);
  var radiance = param.color * attenuation;
  return radiance;
}

fn getPointLightResult(
  worldPos : vec3<f32>,
  normal : vec3<f32>,
  camPos : vec3<f32>,
  matParam : MaterialParam,
  lightParam : PointLightParam
) -> vec3<f32> {
  var radiance = getPointLightRadiance(lightParam, worldPos);
  return getPBRLightingResult(worldPos, normal, camPos, lightParam.worldPos - worldPos, matParam, radiance);
}

fn getDirLightResult(
  worldPos : vec3<f32>,
  normal : vec3<f32>,
  camPos : vec3<f32>,
  matParam : MaterialParam,
  lightParam : DirLightParam
) -> vec3<f32> {
  var radiance = lightParam.color;
  return getPBRLightingResult(worldPos, normal, camPos, -lightParam.direction, matParam, radiance);
}

fn getAmbientResult(
  matParam : MaterialParam,
  ambient : vec3<f32>
) -> vec3<f32> {
  return ambient * matParam.albedo * matParam.ambientOcc;
}