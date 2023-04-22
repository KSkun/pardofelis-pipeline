// uniform definition of all types of lights
// by chengtian.he
// 2023.4.22

#include "lights.h.wgsl"
#include "math.h.wgsl"

#if !BGID_LIGHT
#define BGID_LIGHT 3
#endif

#if POINT_LIGHT_PASS
// point light

const depthOffset = -0.1;
const pcfStep = 0.005;

@group(BGID_LIGHT) @binding(1)
var<uniform> lightParam : PointLightParam;
@group(BGID_LIGHT) @binding(2)
var depthMapSampler : sampler;
@group(BGID_LIGHT) @binding(3)
var depthMap : texture_cube<f32>;

fn testPointLightDepthMap(coords : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
  var queryCoords = vec3<f32>(-coords.x, coords.yz);
  var depthWithOffset = depthRef + depthOffset;
  var depthMapResult = textureSample(depthMap, depthMapSampler, queryCoords).r;
  return f32(depthWithOffset < depthMapResult);
}

fn testPointLightDepthMapPCF(coords : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
#if !ENABLE_SHADOW_PCF
  return testPointLightDepthMap(coords, depthRef);
#endif
  var u = vec3<f32>(0.0, 0.0, 1.0);
  if (abs(dot(u, coords)) > 1.0 - verySmall) { u = vec3<f32>(0.0, 1.0, 0.0); }
  var v = cross(coords, u);
  u = cross(v, coords);
  var visibility : f32 = 0;
  for (var i : i32 = -1; i <= 1; i++) {
    for (var j : i32 = -1; j <= 1; j++) {
      var coordsWithOffset = coords + f32(i) * pcfStep * u + f32(j) * pcfStep * v;
      visibility += testPointLightDepthMap(coordsWithOffset, depthRef);
    }
  }
  return visibility / 9.0;
}

#endif

#if DIR_LIGHT_PASS
// directional light

const depthOffset = -0.2;
const pcfStep = 0.0003;

@group(BGID_LIGHT) @binding(1)
var<uniform> lightParam : DirLightParam;
@group(BGID_LIGHT) @binding(2)
var depthMapSampler : sampler;
@group(BGID_LIGHT) @binding(3)
var depthMap : texture_2d<f32>;

fn testDirLightDepthMapWithUV(uv : vec2<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
  var depthWithOffset = depthRef + depthOffset;
  var depthMapResult = textureSample(depthMap, depthMapSampler, vec2<f32>(uv.x, 1.0 - uv.y)).r;
  return f32(depthWithOffset < depthMapResult);
}

fn testDirLightDepthMap(worldPos : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
  var ndcPos = lightParam.shadowViewProj * vec4<f32>(worldPos, 1.0);
  var uv = (ndcPos.xy + 1.0) / 2.0;
  return testDirLightDepthMapWithUV(uv, depthRef);
}

fn testDirLightDepthMapPCF(worldPos : vec3<f32>, depthRef : f32) -> f32 {
#if !ENABLE_SHADOW_MAP
  return 1.0;
#endif
#if !ENABLE_SHADOW_PCF
  return testDirLightDepthMap(worldPos, depthRef);
#endif
  var ndcPos = lightParam.shadowViewProj * vec4<f32>(worldPos, 1.0);
  var uv = (ndcPos.xy + 1.0) / 2.0;
  var visibility : f32 = 0;
  for (var i : i32 = -1; i <= 1; i++) {
    for (var j : i32 = -1; j <= 1; j++) {
      var uvWithOffset = vec2<f32>(uv.x + f32(i) * pcfStep, uv.y + f32(j) * pcfStep);
      uvWithOffset = clamp(uvWithOffset, vec2<f32>(0.0), vec2<f32>(1.0));
      visibility += testDirLightDepthMapWithUV(uvWithOffset, depthRef);
    }
  }
  return visibility / 9.0;
}

#endif