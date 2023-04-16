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

@group(BGID_SCENE) @binding(2)
var pointLightDepthMapSampler : sampler_comparison;
@group(BGID_SCENE) @binding(3)
var pointLightDepthMap0 : texture_depth_cube;
@group(BGID_SCENE) @binding(4)
var pointLightDepthMap1 : texture_depth_cube;
@group(BGID_SCENE) @binding(5)
var pointLightDepthMap2 : texture_depth_cube;
@group(BGID_SCENE) @binding(6)
var pointLightDepthMap3 : texture_depth_cube;
@group(BGID_SCENE) @binding(7)
var pointLightDepthMap4 : texture_depth_cube;
@group(BGID_SCENE) @binding(8)
var pointLightDepthMap5 : texture_depth_cube;
@group(BGID_SCENE) @binding(9)
var pointLightDepthMap6 : texture_depth_cube;
@group(BGID_SCENE) @binding(10)
var pointLightDepthMap7 : texture_depth_cube;
@group(BGID_SCENE) @binding(11)
var pointLightDepthMap8 : texture_depth_cube;
@group(BGID_SCENE) @binding(12)
var pointLightDepthMap9 : texture_depth_cube;

fn testPointLightDepthMap(index : u32, coords : vec3<f32>, depthRef : f32) -> f32 {
  if (index == 0) {
    return textureSampleCompare(pointLightDepthMap0, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 1) {
    return textureSampleCompare(pointLightDepthMap1, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 2) {
    return textureSampleCompare(pointLightDepthMap2, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 3) {
    return textureSampleCompare(pointLightDepthMap3, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 4) {
    return textureSampleCompare(pointLightDepthMap4, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 5) {
    return textureSampleCompare(pointLightDepthMap5, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 6) {
    return textureSampleCompare(pointLightDepthMap6, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 7) {
    return textureSampleCompare(pointLightDepthMap7, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 8) {
    return textureSampleCompare(pointLightDepthMap8, pointLightDepthMapSampler, coords, depthRef);
  }
  if (index == 9) {
    return textureSampleCompare(pointLightDepthMap9, pointLightDepthMapSampler, coords, depthRef);
  }
  return 0;
}