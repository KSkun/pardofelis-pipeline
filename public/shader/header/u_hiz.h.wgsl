// uniform definition of hierarchy z buffer preparation
// by chengtian.he
// 2023.4.28

@group(BGID_HIZ) @binding(0)
var prevMipZBuffer : texture_depth_2d;
@group(BGID_HIZ) @binding(1)
var<uniform> curMipSize : vec2<u32>;