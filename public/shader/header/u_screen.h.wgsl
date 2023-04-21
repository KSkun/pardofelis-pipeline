// uniform definition of screen framebuffer
// by chengtian.he
// 2023.4.16

#if !BGID_SCREEN
#define BGID_SCREEN 0
#endif

@group(BGID_SCREEN) @binding(0)
var screenFrameBuffer : texture_2d<f32>;