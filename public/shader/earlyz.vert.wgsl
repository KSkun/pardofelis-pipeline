// early-z pass vertex shader
// by chengtian.he
// 2023.4.27

#define BGID_MODEL 0
#define BGID_SCENE 1

#include "u_model.h.wgsl"
#include "u_scene.h.wgsl"

@vertex
fn main(@location(0) pos : vec3<f32>, @builtin(instance_index) instanceIndex : u32) -> @builtin(position) vec4<f32> {
  var modelInfo = modelInfoArr.arr[instanceIndex];
  return sceneInfoVert.projTrans * sceneInfoVert.viewTrans * modelInfo.modelTrans * vec4<f32>(pos, 1.0);
}