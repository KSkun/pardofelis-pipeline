// uniform definition of compute shader overall info
// by chengtian.he
// 2023.4.28

struct CullInfo {
  cameraPos : vec3<f32>,
  viewTrans : mat4x4<f32>,
  projTrans : mat4x4<f32>,
  cullDistance : f32
}

@group(BGID_COMP) @binding(0)
var<uniform> cullInfo : CullInfo;
@group(BGID_COMP) @binding(1)
var hiZBufferMip0 : texture_depth_2d;
@group(BGID_COMP) @binding(2)
var hiZBufferMip1 : texture_depth_2d;
@group(BGID_COMP) @binding(3)
var hiZBufferMip2 : texture_depth_2d;
@group(BGID_COMP) @binding(4)
var hiZBufferMip3 : texture_depth_2d;
@group(BGID_COMP) @binding(5)
var hiZBufferMip4 : texture_depth_2d;
@group(BGID_COMP) @binding(6)
var hiZBufferMip5 : texture_depth_2d;
@group(BGID_COMP) @binding(7)
var hiZBufferMip6 : texture_depth_2d;
@group(BGID_COMP) @binding(8)
var hiZBufferMip7 : texture_depth_2d;
@group(BGID_COMP) @binding(9)
var<uniform> hiZBufferMaxMip : u32;

fn getHiZBuffer(mipLevel : u32, coords : vec2<u32>) -> f32 {
  var mip = min(mipLevel, hiZBufferMaxMip);
  if (mip == 0u) { return textureLoad(hiZBufferMip0, coords, 0); }
  else if (mip == 1u) { return textureLoad(hiZBufferMip1, coords, 0); }
  else if (mip == 2u) { return textureLoad(hiZBufferMip2, coords, 0); }
  else if (mip == 3u) { return textureLoad(hiZBufferMip3, coords, 0); }
  else if (mip == 4u) { return textureLoad(hiZBufferMip4, coords, 0); }
  else if (mip == 5u) { return textureLoad(hiZBufferMip5, coords, 0); }
  else if (mip == 6u) { return textureLoad(hiZBufferMip6, coords, 0); }
  else if (mip == 7u) { return textureLoad(hiZBufferMip7, coords, 0); }
  return 0;
}