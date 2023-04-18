// uniform definition of scene info
// by chengtian.he
// 2023.4.16

#if !BGID_SCENE
#define BGID_SCENE 2
#endif

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

@group(BGID_SCENE) @binding(0)
var<uniform> sceneInfo : SceneInfo;
@group(BGID_SCENE) @binding(1)
var<uniform> pointLights : PointLightArray;

fn getPointLightRadiance(param : PointLightParam, worldPos : vec3<f32>) -> vec3<f32> {
  var lightDist = length(param.worldPos - worldPos);
  var attenuation = 1.0 / (lightDist * lightDist);
  var radiance = param.color * attenuation;
  return radiance;
}

// shadow mapping

@group(BGID_SCENE) @binding(2)
var pointLightDepthMapSampler : sampler;
@group(BGID_SCENE) @binding(3)
var pointLightDepthMap0 : texture_cube<f32>;
@group(BGID_SCENE) @binding(4)
var pointLightDepthMap1 : texture_cube<f32>;
@group(BGID_SCENE) @binding(5)
var pointLightDepthMap2 : texture_cube<f32>;
@group(BGID_SCENE) @binding(6)
var pointLightDepthMap3 : texture_cube<f32>;
@group(BGID_SCENE) @binding(7)
var pointLightDepthMap4 : texture_cube<f32>;
@group(BGID_SCENE) @binding(8)
var pointLightDepthMap5 : texture_cube<f32>;
@group(BGID_SCENE) @binding(9)
var pointLightDepthMap6 : texture_cube<f32>;
@group(BGID_SCENE) @binding(10)
var pointLightDepthMap7 : texture_cube<f32>;
@group(BGID_SCENE) @binding(11)
var pointLightDepthMap8 : texture_cube<f32>;
@group(BGID_SCENE) @binding(12)
var pointLightDepthMap9 : texture_cube<f32>;

const testShadowMapOffset = -0.1;

fn testPointLightDepthMap(index : u32, coords : vec3<f32>, depthRef : f32) -> f32 {
  var queryCoords = vec3<f32>(-coords.x, coords.yz);
  var depthWithOffset = depthRef + testShadowMapOffset;
  var depthMapResult : f32 = 10000;
  if (index == 0u) {
    depthMapResult = textureSample(pointLightDepthMap0, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 1u) {
    depthMapResult = textureSample(pointLightDepthMap1, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 2u) {
    depthMapResult = textureSample(pointLightDepthMap2, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 3u) {
    depthMapResult = textureSample(pointLightDepthMap3, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 4u) {
    depthMapResult = textureSample(pointLightDepthMap4, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 5u) {
    depthMapResult = textureSample(pointLightDepthMap5, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 6u) {
    depthMapResult = textureSample(pointLightDepthMap6, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 7u) {
    depthMapResult = textureSample(pointLightDepthMap7, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 8u) {
    depthMapResult = textureSample(pointLightDepthMap8, pointLightDepthMapSampler, queryCoords).r;
  }
  if (index == 9u) {
    depthMapResult = textureSample(pointLightDepthMap9, pointLightDepthMapSampler, queryCoords).r;
  }
  return f32(depthWithOffset < depthMapResult);
}

const pcsStep = 0.005;

fn testPointLightDepthMapPCS(index : u32, coords : vec3<f32>, depthRef : f32) -> f32 {
  var u = vec3<f32>(0.0, 0.0, 1.0);
  if (dot(u, coords) > 0.9999) { u = vec3<f32>(0.0, 1.0, 0.0); }
  var v = cross(coords, u);
  u = cross(v, coords);
  var visibility : f32 = 0;
  for (var i : i32 = -1; i <= 1; i++) {
    for (var j : i32 = -1; j <= 1; j++) {
      visibility += testPointLightDepthMap(index, coords + f32(i) * pcsStep * u + f32(j) * pcsStep * v, depthRef);
    }
  }
  return visibility / 9.0;
}