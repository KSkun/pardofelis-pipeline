// shadow pass vertex shader
// by chengtian.he
// 2023.4.15

#define BGID_MVP 0
#include "u_mvp.h.wgsl"

struct ShadowVertOutput {
  @builtin(position) pos : vec4<f32>,
  @location(0) viewPos: vec3<f32>
}

@vertex
fn main(@location(0) pos : vec3<f32>) -> ShadowVertOutput {
  var output : ShadowVertOutput;
  var pos4 = vec4<f32>(pos, 1.0);
  output.pos = mtxMVP.modelViewProj * pos4;
  output.viewPos = (mtxMVP.modelView * pos4).xyz;
  return output;
}