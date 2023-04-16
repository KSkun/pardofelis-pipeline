// shadow pass vertex shader
// by chengtian.he
// 2023.4.15

struct MtxMVP {
  model : mat4x4<f32>,
  view : mat4x4<f32>,
  proj : mat4x4<f32>,
  modelView : mat4x4<f32>,
  modelViewProj : mat4x4<f32>,
  norm : mat3x3<f32>
}

@group(0) @binding(0)
var<uniform> mtxMVP : MtxMVP;

@vertex
fn main(@location(0) pos : vec3<f32>) -> @builtin(position) vec4<f32> {
  return mtxMVP.modelViewProj * vec4<f32>(pos, 1.0);
}