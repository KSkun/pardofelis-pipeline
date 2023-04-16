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
