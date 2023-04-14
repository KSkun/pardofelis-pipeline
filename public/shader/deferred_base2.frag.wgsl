// base pass 2 of deferred pipeline
// by chengtian.he
// 2023.4.14

#include "u_material.h.wgsl"

struct GBufFragOutput2 {
  @location(0) albedo : vec4<f32>,
  @location(1) rmao : vec4<f32>
}

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>
) -> GBufFragOutput2 {
  var matParam = getMatParam(texCoord);
  var output : GBufFragOutput2;
  output.albedo = vec4<f32>(matParam.albedo, 0.0);
  output.rmao = vec4<f32>(matParam.roughness, matParam.metallic, matParam.ambientOcc, 0.0);
  return output;
}