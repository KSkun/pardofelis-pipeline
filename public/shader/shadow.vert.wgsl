// shadow pass vertex shader
// by chengtian.he
// 2023.4.15

#define BGID_MVP 0
#include "u_mvp.h.wgsl"

@vertex
fn main(@location(0) pos : vec3<f32>) -> @builtin(position) vec4<f32> {
  return mtxMVP.modelViewProj * vec4<f32>(pos, 1.0);
}