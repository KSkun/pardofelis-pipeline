// uniform definition of scene info
// by chengtian.he
// 2023.4.16

struct SceneInfo {
  cameraPos : vec3<f32>,
  ambient : vec3<f32>
}

@group(BGID_SCENE) @binding(0)
var<uniform> sceneInfo : SceneInfo;