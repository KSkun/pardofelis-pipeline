// normal mapping functions
// by chengtian.he
// 2023.4.14

fn mapNormal(normal : vec3<f32>, tangent : vec3<f32>, normalToTrans: vec3<f32>) -> vec3<f32> {
  var reorthoTangent = normalize(tangent - dot(tangent, normal) * normal);
  var bitangent = cross(reorthoTangent, normal);
  var mtxTBN = mat3x3<f32>(reorthoTangent, bitangent, normal);
  return normalize(mtxTBN * normalToTrans);
}