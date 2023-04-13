// PBR shading functions
// by chengtian.he
// 2023.4.13

const f0NonMetallic = vec3<f32>(0.04);

fn getF0(albedo : vec3<f32>, metallic : f32) -> vec3<f32> {
  return mix(f0NonMetallic, albedo, metallic);
}

fn getFresnelSchlick(cosTheta : f32, f0 : vec3<f32>) -> vec3<f32> {
  return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn getDistributionGGX(normal : vec3<f32>, halfway : vec3<f32>, roughness : f32) -> f32 {
  var a = roughness * roughness;
  var aSqr = a * a;
  var dotNH = max(dot(normal, halfway), 0.0);
  var dotNHSqr = dotNH * dotNH;
  var denomPart = dotNHSqr * (aSqr - 1.0) + 1.0;
  return aSqr / (pi * denomPart * denomPart);
}

fn getGeometrySchlickGGX(dotNV : f32, roughness : f32) -> f32 {
  var r = roughness + 1.0;
  var k = (r * r) / 8.0;
  return dotNV / (dotNV * (1.0 - k) + k);
}

fn getGeometrySmith(normal : vec3<f32>, view : vec3<f32>, light : vec3<f32>, roughness : f32) -> f32 {
  var dotNV = max(dot(normal, view), 0.0);
  var dotNL = max(dot(normal, light), 0.0);
  var ggx1 = getGeometrySchlickGGX(dotNL, roughness);
  var ggx2 = getGeometrySchlickGGX(dotNV, roughness);
  return ggx1 * ggx2;
}