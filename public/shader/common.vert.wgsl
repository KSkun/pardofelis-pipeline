// common vertex shader
// by chengtian.he
// 2023.3.1

#define BGID_MODEL 0
#define BGID_SCENE 1

#include "u_model.h.wgsl"
#include "u_scene.h.wgsl"

struct VertOutput {
  @builtin(position) pos : vec4<f32>,
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>
}

@vertex
fn main(
  @location(0) pos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>,
  @builtin(instance_index) instanceIndex : u32
) -> VertOutput {
  var output : VertOutput;
  var pos4 = vec4<f32>(pos, 1.0);
  var modelInfo = modelInfoArr.arr[instanceIndex];
  output.worldPos = (modelInfo.modelTrans * pos4).xyz;
  output.pos = sceneInfoVert.projTrans * sceneInfoVert.viewTrans * vec4<f32>(output.worldPos, 1.0);
  output.normal = normalize(modelInfo.normalTrans * normal);
  output.texCoord = texCoord;
  output.tangent = normalize((modelInfo.modelTrans * vec4(tangent, 0.0)).xyz);
  return output;
}