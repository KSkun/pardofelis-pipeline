// PBR lighting fragment shader
// by chengtian.he
// 2023.3.1

#include "math.h.wgsl"
#include "pbr.h.wgsl"
#include "postprocess.h.wgsl"

#define BGID_MATERIAL 1
#define BGID_SCENE 2

#include "u_material.h.wgsl"
#include "u_scene.h.wgsl"

fn getLightResult(
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

const ambient = vec3<f32>(0.2);

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
    var shadowResult = testPointLightDepthMapPCS(i, normalize(lightViewPos), length(lightViewPos));
    lightResult += shadowResult * getLightResult(worldPos, mappedNormal, sceneInfo.cameraPos, matParam, lightParam);
  }
  lightResult += ambient * matParam.albedo * material.ambientOcc;
  var mappedColor = mapTone(lightResult);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, 1.0);
}