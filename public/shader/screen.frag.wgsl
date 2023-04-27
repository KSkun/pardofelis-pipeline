// light pass of deferred pipeline
// by chengtian.he
// 2023.3.23

#include "postprocess.h.wgsl"

#define BGID_SCREEN 0
#include "u_screen.h.wgsl"

struct ScreenOutput {
  @location(0) color : vec4<f32>,
  @location(1) colorPrevFB : vec4<f32>
}

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> ScreenOutput {
  var screenPosInt2 = vec2<i32>(floor(screenPos.xy));
  var fbColor = textureLoad(screenFrameBuffer, screenPosInt2, 0);
  var processedColor = fbColor.rgb;

#if ENABLE_TONE_MAPPING
  processedColor = mapTone(processedColor);
#endif

  var srgbColor = convertLinearToSRGB(processedColor);

  var output : ScreenOutput;
  output.color = vec4<f32>(srgbColor, fbColor.a);
  output.colorPrevFB = vec4<f32>(0.0, 0.0, 0.0, 1.0); // clear framebuffer texture for next frame
  return output;
}