// uniform definition of screen framebuffer
// by chengtian.he
// 2023.4.16

#if !BGID_SCREEN
#define BGID_SCREEN 0
#endif

@group(BGID_SCREEN) @binding(0)
var screenFrameBuffer : texture_2d<f32>;
// DEBUG ONLY
// @group(BGID_SCREEN) @binding(1)
// var<uniform> screenSize : vec2<u32>;
// @group(BGID_SCREEN) @binding(2)
// var debugDrawDepth : texture_depth_2d;