// uniform definition of material
// by chengtian.he
// 2023.4.14

#include "material.h.wgsl"

const texStatusAlbedo = 0x1u;
const texStatusRoughness = 0x2u;
const texStatusMetallic = 0x4u;
const texStatusAmbientOcc = 0x8u;
const texStatusNormal = 0xfu;
@group(1) @binding(0)
var<uniform> material : MaterialParam;
@group(1) @binding(1)
var<uniform> texStatus : u32;
@group(1) @binding(2)
var texSampler : sampler;
@group(1) @binding(3)
var albedoMap : texture_2d<f32>;
@group(1) @binding(4)
var roughnessMap : texture_2d<f32>;
@group(1) @binding(5)
var metallicMap : texture_2d<f32>;
@group(1) @binding(6)
var ambientOccMap : texture_2d<f32>;
@group(1) @binding(7)
var normalMap : texture_2d<f32>;

fn getAlbedo(texCoord: vec2<f32>) -> vec3<f32> {
  var albedo = material.albedo;
  if ((texStatus & texStatusAlbedo) > 0u) {
    var texel = textureSample(albedoMap, texSampler, texCoord);
    albedo = texel.rgb;
  }
  return convertSRGBToLinear(albedo);
}

fn getRoughness(texCoord: vec2<f32>) -> f32 {
  var roughness = material.roughness;
  if ((texStatus & texStatusRoughness) > 0u) {
    var texel = textureSample(roughnessMap, texSampler, texCoord);
    roughness = texel.r;
  }
  return roughness;
}

fn getMetallic(texCoord: vec2<f32>) -> f32 {
  var metallic = material.metallic;
  if ((texStatus & texStatusMetallic) > 0u) {
    var texel = textureSample(metallicMap, texSampler, texCoord);
    metallic = texel.r;
  }
  return metallic;
}

fn getAmbientOcc(texCoord: vec2<f32>) -> f32 {
  var ambientOcc = material.ambientOcc;
  if ((texStatus & texStatusAmbientOcc) > 0u) {
    var texel = textureSample(ambientOccMap, texSampler, texCoord);
    ambientOcc = texel.r;
  }
  return ambientOcc;
}

fn getMatParam(texCoord: vec2<f32>) -> MaterialParam {
  var matParam: MaterialParam;
  matParam.albedo = getAlbedo(texCoord);
  matParam.roughness = getRoughness(texCoord);
  matParam.metallic = getMetallic(texCoord);
  matParam.ambientOcc = getAmbientOcc(texCoord);
  return matParam;
}