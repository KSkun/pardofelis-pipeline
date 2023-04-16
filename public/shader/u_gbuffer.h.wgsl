// uniform definition of G-buffers
// by chengtian.he
// 2023.4.14

#if !BGID_GBUFFER
#define BGID_GBUFFER 1
#endif

@group(BGID_GBUFFER) @binding(0)
var gBufWorldPos : texture_2d<f32>;
@group(BGID_GBUFFER) @binding(1)
var gBufNormal : texture_2d<f32>;
@group(BGID_GBUFFER) @binding(2)
var gBufAlbedo : texture_2d<f32>;
@group(BGID_GBUFFER) @binding(3)
var gBufRMAO : texture_2d<f32>;