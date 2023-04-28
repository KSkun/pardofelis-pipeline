// hierarchy z buffer preparation
// by chengtian.he
// 2023.4.28

#define BGID_HIZ 0

#include "u_hiz.h.wgsl"

@fragment
fn main(@builtin(position) screenPos : vec4<f32>) -> @builtin(frag_depth) f32 {
  var screenPosInt2 = vec2<u32>(floor(screenPos.xy) * 2.0);
  var maxDepth = 0.0;
  maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(0, 0), 0));
  maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(0, 1), 0));
  maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(1, 0), 0));
  maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(1, 1), 0));
  // if previous mip size is odd
  var prevMipSize = textureDimensions(prevMipZBuffer);
  var isXBorderExt = (prevMipSize.x & 1u) > 0 && screenPosInt2.x == curMipSize.x - 1;
  var isYBorderExt = (prevMipSize.y & 1u) > 0 && screenPosInt2.y == curMipSize.y - 1;
  // extend in x coord
  if (isXBorderExt) {
    maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(2, 0), 0));
    maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(2, 1), 0));
  }
  // extend in y coord
  if (isYBorderExt) {
    maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(0, 2), 0));
    maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(1, 2), 0));
  }
  // both x and y is extended
  if (isXBorderExt && isYBorderExt) {
    maxDepth = max(maxDepth, textureLoad(prevMipZBuffer, screenPosInt2 + vec2<u32>(2, 2), 0));
  }
  return maxDepth;
}