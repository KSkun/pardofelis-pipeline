// uniform definition of scene info
// by chengtian.he
// 2023.4.16

struct SceneInfoVert {
  viewTrans : mat4x4<f32>,
  projTrans : mat4x4<f32>
}

struct SceneInfoFrag {
  cameraPos : vec3<f32>,
  ambient : vec3<f32>
}

@group(BGID_SCENE) @binding(0)
var<uniform> sceneInfo : SceneInfoFrag;

@group(BGID_SCENE) @binding(1)
var<uniform> sceneInfoVert : SceneInfoVert;