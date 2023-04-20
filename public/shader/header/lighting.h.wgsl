// lighting functions
// by chengtian.he
// 2023.4.20

#include "pbr.h.wgsl"
#include "math.h.wgsl"

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
  var view = normalize(camPos - worldPos);
  var light = normalize(lightParam.worldPos - worldPos);
  var halfway = (view + light) / 2.0;
  var dotNV = max(dot(normal, view), 0.0);
  var dotNL = max(dot(normal, light), 0.0);
  var dotHV = max(dot(halfway, view), 0.0);

  var dist = getDistributionGGX(normal, halfway, matParam.roughness);
  var geo = getGeometrySmith(normal, view, light, matParam.roughness);
  var f0 = getF0(matParam.albedo, matParam.metallic);
  var fresnel = getFresnelSchlick(dotHV, f0);

  var kSpecular = fresnel;
  var kDiffuse = (vec3<f32>(1.0) - kSpecular) * (1.0 - matParam.metallic);
  var specular = dist * geo * fresnel / (4.0 * dotNV * dotNL + verySmall);
  var diffuse = kDiffuse * matParam.albedo / pi;
  var radiance = getPointLightRadiance(lightParam, worldPos);
  return (diffuse + specular) * radiance * dotNL;
}

fn getAmbientResult(
  matParam : MaterialParam,
  ambient : vec3<f32>
) -> vec3<f32> {
  return ambient * matParam.albedo * matParam.ambientOcc;
}