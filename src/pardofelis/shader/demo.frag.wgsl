// Math Utils Begin

const pi = 3.14159265358979;
const verySmall = 0.0001;

// Math Utils End

// PBR Begin

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

// PBR End

// Post Process Begin

const gamma = 2.2;

fn convertLinearToSRGB(linearColor : vec3<f32>) -> vec3<f32> {
  return pow(linearColor, vec3<f32>(1.0 / gamma));
}

fn convertSRGBToLinear(srgbColor : vec3<f32>) -> vec3<f32> {
  return pow(srgbColor, vec3<f32>(gamma));
}

fn mapTone(hdrColor : vec3<f32>) -> vec3<f32> {
  return hdrColor / (hdrColor + vec3<f32>(1.0));
}

// Post Process End

struct MaterialParam {
  albedo : vec3<f32>,
  roughness : f32,
  metallic : f32,
  ambientOcc : f32
}

struct PointLightParam {
  worldPos : vec3<f32>,
  color : vec3<f32>
}

const pointLightNumMax = 10;

struct PointLightArray {
  size : u32,
  arr : array<PointLightParam, pointLightNumMax>
}

const texStatusAlbedo = 0x1u;

@group(0) @binding(1)
var<uniform> cameraPos : vec3<f32>;

@group(1) @binding(0)
var<uniform> material : MaterialParam;
@group(1) @binding(1)
var<uniform> texStatus : u32;
@group(1) @binding(2)
var texSampler : sampler;
@group(1) @binding(3)
var albedoMap : texture_2d<f32>;

fn getAlbedo(texCoord: vec2<f32>) -> vec3<f32> {
  var albedo = material.albedo;
  if ((texStatus & texStatusAlbedo) > 0u) {
    var texel = textureSample(albedoMap, texSampler, texCoord);
    albedo = texel.rgb;
  }
  return convertSRGBToLinear(albedo);
}

@group(2) @binding(0)
var<uniform> pointLights : PointLightArray;

fn getLightResult(
  worldPos : vec3<f32>,
  normal : vec3<f32>,
  texCoord : vec2<f32>,
  camPos : vec3<f32>,
  matParam : MaterialParam,
  lightParam : PointLightParam
) -> vec3<f32> {
  var albedo = getAlbedo(texCoord);

  var view = normalize(camPos - worldPos);
  var light = normalize(lightParam.worldPos - worldPos);
  var halfway = (view + light) / 2.0;
  var lightDist = length(lightParam.worldPos - worldPos);
  var attenuation = 1.0 / (lightDist * lightDist); // TODO
  // var attenuation = 1.0;
  var radiance = lightParam.color * attenuation;
  var dotNV = max(dot(normal, view), 0.0);
  var dotNL = max(dot(normal, light), 0.0);
  var dotHV = max(dot(halfway, view), 0.0);

  var dist = getDistributionGGX(normal, halfway, matParam.roughness);
  var geo = getGeometrySmith(normal, view, light, matParam.roughness);
  var f0 = getF0(albedo, matParam.metallic);
  var fresnel = getFresnelSchlick(dotHV, f0);

  var kSpecular = fresnel;
  var kDiffuse = (vec3<f32>(1.0) - kSpecular) * (1.0 - matParam.metallic);
  var specular = dist * geo * fresnel / (4.0 * dotNV * dotNL + verySmall);
  var diffuse = kDiffuse * albedo / pi;
  return (diffuse + specular) * radiance * dotNL;
}

const ambient = vec3<f32>(0.2);

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>
) -> @location(0) vec4<f32> {
  var lightResult = vec3<f32>(0.0, 0.0, 0.0);
  for (var i : u32 = 0; i < pointLights.size; i++) {
    var lightParam = pointLights.arr[i];
    lightResult += getLightResult(worldPos, normal, texCoord, cameraPos, material, lightParam);
  }
  lightResult += ambient * getAlbedo(texCoord) * material.ambientOcc;
  var mappedColor = mapTone(lightResult);
  var srgbColor = convertLinearToSRGB(mappedColor);
  return vec4<f32>(srgbColor, 1.0);
}