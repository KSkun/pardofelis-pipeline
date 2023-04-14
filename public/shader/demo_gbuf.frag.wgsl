// base pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "postprocess.h.wgsl"

#include "u_material.h.wgsl"

struct GBufFragOutput {
  @location(0) worldPos : vec4<f32>,
  @location(1) normal : vec4<f32>,
  @location(2) albedo : vec4<f32>,
  @location(3) rmao : vec4<f32>
}

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>
) -> GBufFragOutput {
  var matParam = getMatParam(texCoord);
  var output : GBufFragOutput;
  output.worldPos = vec4<f32>(worldPos, 1.0);
  output.normal = vec4<f32>(normal, 0.0);
  output.albedo = vec4<f32>(matParam.albedo, 0.0);
  output.rmao = vec4<f32>(matParam.roughness, matParam.metallic, matParam.ambientOcc, 0.0);
  return output;
}