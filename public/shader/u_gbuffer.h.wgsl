// uniform definition of G-buffers
// by chengtian.he
// 2023.4.14

@group(1) @binding(0)
var gBufWorldPos : texture_2d<f32>;
@group(1) @binding(1)
var gBufNormal : texture_2d<f32>;
@group(1) @binding(2)
var gBufAlbedo : texture_2d<f32>;
@group(1) @binding(3)
var gBufRMAO : texture_2d<f32>;