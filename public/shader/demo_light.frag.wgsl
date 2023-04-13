// light pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "math.h.wgsl"
#include "pbr.h.wgsl"
#include "postprocess.h.wgsl"

struct MaterialParam {
  albedo : vec3<f32>,
  roughness : f32,
  metallic : f32,
  ambientOcc : f32
}

struct SceneInfo {
  cameraPos : vec3<f32>
}

const pointLightNumMax = 10;

struct PointLightParam {
  worldPos : vec3<f32>,
  color : vec3<f32>
}

struct PointLightArray {
  size : u32,
  arr : array<PointLightParam, pointLightNumMax>
}

@group(0) @binding(0)
var<uniform> sceneInfo : SceneInfo;
@group(0) @binding(1)
var<uniform> pointLights : PointLightArray;

@group(1) @binding(0)
var gBufWorldPos : texture_2d<f32>;
@group(1) @binding(1)
var gBufNormal : texture_2d<f32>;
@group(1) @binding(2)
var gBufAlbedo : texture_2d<f32>;
@group(1) @binding(3)
var gBufRMAO : texture_2d<f32>;

fn getLightResult(
  worldPos : vec3<f32>,
  normal : vec3<f32>,
  albedo : vec3<f32>,
  camPos : vec3<f32>,
  matParam : MaterialParam,
  lightParam : PointLightParam
) -> vec3<f32> {
  var view = normalize(camPos - worldPos);
  var light = normalize(lightParam.worldPos - worldPos);
  var halfway = (view + light) / 2.0;
  var lightDist = length(lightParam.worldPos - worldPos);
  var attenuation = 1.0 / (lightDist * lightDist); // TODO
  // var attenuation = 1.0;
  var radiance = lightParam.color * attenuation;
  var dotNV = max(dot(normal, view), 0.0);
  var dotNL = max(dot(normal, light), 0.0);
  var dotHV = max(dot(halfway, view), 0.0);

  var dist = getDistributionGGX(normal, halfway, matParam.roughness);
  var geo = getGeometrySmith(normal, view, light, matParam.roughness);
  var f0 = getF0(albedo, matParam.metallic);
  var fresnel = getFresnelSchlick(dotHV, f0);

  var kSpecular = fresnel;
  var kDiffuse = (vec3<f32>(1.0) - kSpecular) * (1.0 - matParam.metallic);
  var specular = dist * geo * fresnel / (4.0 * dotNV * dotNL + verySmall);
  var diffuse = kDiffuse * albedo / pi;
  return (diffuse + specular) * radiance * dotNL;
}

const ambient = vec3<f32>(0.2);

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> @location(0) vec4<f32> {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));

  var worldPos4 = textureLoad(gBufWorldPos, screenPosInt2, 0);
  var worldPos = worldPos4.xyz;
  var normal = textureLoad(gBufNormal, screenPosInt2, 0).xyz;
  var albedo = textureLoad(gBufAlbedo, screenPosInt2, 0).rgb;
  var rmao = textureLoad(gBufRMAO, screenPosInt2, 0).rgb;

  // flag value for skip pixels
  if (worldPos4.w == 0.0) {
    discard;
  }

  var matParam : MaterialParam;
  matParam.roughness = rmao.r;
  matParam.metallic = rmao.g;
  matParam.ambientOcc = rmao.b;

  var lightResult = vec3<f32>(0.0, 0.0, 0.0);
  for (var i : u32 = 0; i < pointLights.size; i++) {
    var lightParam = pointLights.arr[i];
    lightResult += getLightResult(worldPos, normal, albedo, sceneInfo.cameraPos, matParam, lightParam);
  }
  lightResult += ambient * albedo * matParam.ambientOcc;
  var mappedColor = mapTone(lightResult);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, 1.0);
}