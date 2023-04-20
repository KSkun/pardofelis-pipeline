// base pass 1 of deferred pipeline
// by chengtian.he
// 2023.3.23

#define BGID_MATERIAL 1
#include "u_material.h.wgsl"

struct GBufFragOutput1 {
  @location(0) worldPos : vec4<f32>,
  @location(1) normal : vec4<f32>
}

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>,
  @location(3) tangent : vec3<f32>
) -> GBufFragOutput1 {
  var output : GBufFragOutput1;
  output.worldPos = vec4<f32>(worldPos, 1.0);
  var mappedNormal = getNormal(normal, tangent, texCoord);
  output.normal = vec4<f32>((mappedNormal + 1.0) / 2.0, 0.0);
  return output;
}