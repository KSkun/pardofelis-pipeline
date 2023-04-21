// light pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "postprocess.h.wgsl"

#define BGID_SCREEN 0
#include "u_screen.h.wgsl"

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> @location(0) vec4<f32> {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));
  var fbColor = textureLoad(screenFrameBuffer, screenPosInt2, 0);
  var mappedColor = mapTone(fbColor.rgb);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, fbColor.a);
}