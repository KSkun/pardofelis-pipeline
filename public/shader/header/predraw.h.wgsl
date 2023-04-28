// predraw compute pass util functions
// by chengtian.he
// 2023.4.28

fn isInsideNDC(ndcCoord : vec3<f32>) -> bool {
  return ndcCoord.x >= -1.0 && ndcCoord.x <= 1.0
    && ndcCoord.y >= -1.0 && ndcCoord.y <= 1.0
    && ndcCoord.z >= 0.0 && ndcCoord.z <= 1.0;
}

struct BoundingBox {
  min : vec3<f32>,
  max : vec3<f32>
}

fn transformBBox(bbox : BoundingBox, trans : mat4x4<f32>) -> BoundingBox {
  var result : BoundingBox;
  var vertices = array<vec4<f32>, 8>(
    trans * vec4<f32>(bbox.min.x, bbox.min.y, bbox.min.z, 1.0),
    trans * vec4<f32>(bbox.min.x, bbox.min.y, bbox.max.z, 1.0),
    trans * vec4<f32>(bbox.min.x, bbox.max.y, bbox.min.z, 1.0),
    trans * vec4<f32>(bbox.max.x, bbox.min.y, bbox.min.z, 1.0),
    trans * vec4<f32>(bbox.min.x, bbox.max.y, bbox.max.z, 1.0),
    trans * vec4<f32>(bbox.max.x, bbox.max.y, bbox.min.z, 1.0),
    trans * vec4<f32>(bbox.max.x, bbox.min.y, bbox.max.z, 1.0),
    trans * vec4<f32>(bbox.max.x, bbox.max.y, bbox.max.z, 1.0)
  );
  result.min = vertices[0].xyz;
  result.max = vertices[0].xyz;
  for (var i = 1u; i < 8u; i++) {
    result.min = min(result.min, vertices[i].xyz);
    result.max = max(result.max, vertices[i].xyz);
  }
  return result;
}

fn testCullDistance(bbox : BoundingBox, cameraPos : vec3<f32>, distance : f32) -> bool {
  var vertices = array<vec3<f32>, 8>(
    vec3<f32>(bbox.min.x, bbox.min.y, bbox.min.z),
    vec3<f32>(bbox.min.x, bbox.min.y, bbox.max.z),
    vec3<f32>(bbox.min.x, bbox.max.y, bbox.min.z),
    vec3<f32>(bbox.max.x, bbox.min.y, bbox.min.z),
    vec3<f32>(bbox.min.x, bbox.max.y, bbox.max.z),
    vec3<f32>(bbox.max.x, bbox.max.y, bbox.min.z),
    vec3<f32>(bbox.max.x, bbox.min.y, bbox.max.z),
    vec3<f32>(bbox.max.x, bbox.max.y, bbox.max.z)
  );
  var bboxDist = distance;
  for (var i = 0u; i < 8u; i++) {
    bboxDist = min(bboxDist, length(vertices[i] - cameraPos));
  }
  return bboxDist < distance;
}

fn testCullFrustum(bbox : BoundingBox) -> bool {
  var vertices = array<vec3<f32>, 8>(
    vec3<f32>(bbox.min.x, bbox.min.y, bbox.min.z),
    vec3<f32>(bbox.min.x, bbox.min.y, bbox.max.z),
    vec3<f32>(bbox.min.x, bbox.max.y, bbox.min.z),
    vec3<f32>(bbox.max.x, bbox.min.y, bbox.min.z),
    vec3<f32>(bbox.min.x, bbox.max.y, bbox.max.z),
    vec3<f32>(bbox.max.x, bbox.max.y, bbox.min.z),
    vec3<f32>(bbox.max.x, bbox.min.y, bbox.max.z),
    vec3<f32>(bbox.max.x, bbox.max.y, bbox.max.z)
  );
  for (var i = 0u; i < 8u; i++) {
    if (!isInsideNDC(vertices[i])) { return false; }
  }
  return true;
}

// fn testCullOcclusion(bbox : BoundingBox, hiZBuffer : texture_depth_2d) -> bool {
//   // TODO
//   return true;
// }