// uniform definition of MVP matrices
// by chengtian.he
// 2023.4.16

#if !BGID_MVP
#define BGID_MVP 0
#endif

struct MtxMVP {
  model : mat4x4<f32>,
  view : mat4x4<f32>,
  proj : mat4x4<f32>,
  modelView : mat4x4<f32>,
  modelViewProj : mat4x4<f32>,
  norm : mat3x3<f32>
}

@group(BGID_MVP) @binding(0)
var<uniform> mtxMVP : MtxMVP;