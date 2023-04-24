// shadow pass vertex shader
// by chengtian.he
// 2023.4.15

#define BGID_MODEL 0
#define BGID_SCENE 1

#include "u_model.h.wgsl"
#include "u_scene.h.wgsl"

struct ShadowVertOutput {
  @builtin(position) pos : vec4<f32>,
  @location(0) viewPos: vec3<f32>
}

@vertex
fn main(@location(0) pos : vec3<f32>, @builtin(instance_index) instanceIndex : u32) -> ShadowVertOutput {
  var output : ShadowVertOutput;
  var pos4 = vec4<f32>(pos, 1.0);
  var modelInfo = modelInfoArr.arr[instanceIndex];
  output.viewPos = (sceneInfoVert.viewTrans * modelInfo.modelTrans * pos4).xyz;
  output.pos = sceneInfoVert.projTrans * vec4<f32>(output.viewPos, 1.0);
  return output;
}