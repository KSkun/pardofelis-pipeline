// uniform definition of scene info
// by chengtian.he
// 2023.4.16

#include "lights.h.wgsl"

#if !BGID_SCENE
#define BGID_SCENE 2
#endif

const testShadowMapOffset = -0.1;
const pointLightPCFStep = 0.005;
const dirLightPCFStep = 0.005;

struct SceneInfo {
  cameraPos : vec3<f32>,
  ambient : vec3<f32>
}

@group(BGID_SCENE) @binding(0)
var<uniform> sceneInfo : SceneInfo;

// point light

@group(BGID_SCENE) @binding(1)
var<uniform> pointLights : PointLightArray;

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

fn testPointLightDepthMap(index : u32, coords : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
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

fn testPointLightDepthMapPCF(index : u32, coords : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
#if !ENABLE_SHADOW_PCF
  return testPointLightDepthMap(index, coords, depthRef);
#endif
  var u = vec3<f32>(0.0, 0.0, 1.0);
  if (dot(u, coords) > 0.9999) { u = vec3<f32>(0.0, 1.0, 0.0); }
  var v = cross(coords, u);
  u = cross(v, coords);
  var visibility : f32 = 0;
  for (var i : i32 = -1; i <= 1; i++) {
    for (var j : i32 = -1; j <= 1; j++) {
      var coordsWithOffset = coords + f32(i) * pointLightPCFStep * u + f32(j) * pointLightPCFStep * v;
      visibility += testPointLightDepthMap(index, coordsWithOffset, depthRef);
    }
  }
  return visibility / 9.0;
}

// directional light

@group(BGID_SCENE) @binding(13)
var<uniform> dirLights : DirLightArray;

// shadow mapping
// TODO Due to WebGPU's single pass texture number limit, light pass is under refactoring.
// TODO We try to keep a minimum workable feature of the new directional light,
// TODO and these shadow mapping codes are temporarily removed.

// @group(BGID_SCENE) @binding(14)
// var dirLightDepthMapSampler : sampler;
// @group(BGID_SCENE) @binding(15)
// var dirLightDepthMap0 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(16)
// var dirLightDepthMap1 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(17)
// var dirLightDepthMap2 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(18)
// var dirLightDepthMap3 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(19)
// var dirLightDepthMap4 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(20)
// var dirLightDepthMap5 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(21)
// var dirLightDepthMap6 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(22)
// var dirLightDepthMap7 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(23)
// var dirLightDepthMap8 : texture_2d<f32>;
// @group(BGID_SCENE) @binding(24)
// var dirLightDepthMap9 : texture_2d<f32>;

// fn testDirLightDepthMapWithUV(index : u32, uv : vec2<f32>, depthRef : f32) -> f32 {
// #if !ENABLE_SHADOW_MAP
//   return 1.0;
// #endif
//   var depthWithOffset = depthRef + testShadowMapOffset;
//   var depthMapResult : f32 = 10000;
//   if (index == 0u) {
//     depthMapResult = textureSample(dirLightDepthMap0, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 1u) {
//     depthMapResult = textureSample(dirLightDepthMap1, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 2u) {
//     depthMapResult = textureSample(dirLightDepthMap2, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 3u) {
//     depthMapResult = textureSample(dirLightDepthMap3, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 4u) {
//     depthMapResult = textureSample(dirLightDepthMap4, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 5u) {
//     depthMapResult = textureSample(dirLightDepthMap5, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 6u) {
//     depthMapResult = textureSample(dirLightDepthMap6, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 7u) {
//     depthMapResult = textureSample(dirLightDepthMap7, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 8u) {
//     depthMapResult = textureSample(dirLightDepthMap8, dirLightDepthMapSampler, uv).r;
//   }
//   if (index == 9u) {
//     depthMapResult = textureSample(dirLightDepthMap9, dirLightDepthMapSampler, uv).r;
//   }
//   return f32(depthWithOffset < depthMapResult);
// }

// fn testDirLightDepthMap(index : u32, worldPos : vec3<f32>, depthRef : f32) -> f32 {
// #if !ENABLE_SHADOW_MAP
//   return 1.0;
// #endif
//   var ndcPos = dirLights.arr[index].shadowViewProj * vec4<f32>(worldPos, 1.0);
//   var uv = (ndcPos.xy + 1.0) / 2.0;
//   return testDirLightDepthMapWithUV(index, uv, depthRef);
// }

// fn testDirLightDepthMapPCF(index : u32, worldPos : vec3<f32>, depthRef : f32) -> f32 {
// #if !ENABLE_SHADOW_MAP
//   return 1.0;
// #endif
// #if !ENABLE_SHADOW_PCF
//   return testDirLightDepthMap(index, worldPos, depthRef);
// #endif
//   var ndcPos = dirLights.arr[index].shadowViewProj * vec4<f32>(worldPos, 1.0);
//   var uv = (ndcPos.xy + 1.0) / 2.0;
//   var visibility : f32 = 0;
//   for (var i : i32 = -1; i <= 1; i++) {
//     for (var j : i32 = -1; j <= 1; j++) {
//       var uvWithOffset = vec2<f32>(uv.x + f32(i) * dirLightPCFStep, uv.y + f32(j) * dirLightPCFStep);
//       uvWithOffset = clamp(uvWithOffset, vec2<f32>(0.0), vec2<f32>(1.0));
//       visibility += testDirLightDepthMapWithUV(index, uvWithOffset, depthRef);
//     }
//   }
//   return visibility / 9.0;
// }