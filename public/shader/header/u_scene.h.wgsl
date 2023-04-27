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

#if !EARLY_Z_PASS
@group(BGID_SCENE) @binding(2)
var earlyZBuffer : texture_depth_2d;

const testEarlyZOffset = -0.0000001;

fn testEarlyZ(screenPos: vec4<f32>) -> bool {
#if !ENABLE_EARLY_Z
  return true;
#endif
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));
  var earlyZDepth = textureLoad(earlyZBuffer, screenPosInt2, 0);
  return (screenPos.z + testEarlyZOffset) < earlyZDepth;
}
#endif