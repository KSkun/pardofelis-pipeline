// common vertex shader
// by chengtian.he
// 2023.3.1

#define BGID_MVP 0
#include "u_mvp.h.wgsl"

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
  @location(3) tangent : vec3<f32>
) -> VertOutput {
  var output : VertOutput;
  var pos4 = vec4<f32>(pos, 1.0);
  output.pos = mtxMVP.modelViewProj * pos4;
  output.worldPos = (mtxMVP.model * pos4).xyz;
  output.normal = normalize(mtxMVP.norm * normal);
  output.texCoord = texCoord;
  output.tangent = normalize((mtxMVP.model * vec4(tangent, 0.0)).xyz);
  return output;
}