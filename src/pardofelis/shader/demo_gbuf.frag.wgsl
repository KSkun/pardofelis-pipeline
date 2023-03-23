// Post Process Begin

const gamma = 2.2;

fn convertSRGBToLinear(srgbColor : vec3<f32>) -> vec3<f32> {
  return pow(srgbColor, vec3<f32>(gamma));
}

// Post Process End

struct MaterialParam {
  albedo : vec3<f32>,
  roughness : f32,
  metallic : f32,
  ambientOcc : f32
}

const texStatusAlbedo = 0x1u;

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

struct GBufFragOutput {
  @location(0) worldPos : vec4<f32>,
  @location(1) normal : vec4<f32>,
  @location(2) albedo : vec4<f32>,
  @location(3) rmao : vec4<f32>
}

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) texCoord : vec2<f32>
) -> GBufFragOutput {
  var output : GBufFragOutput;
  output.worldPos = vec4<f32>(worldPos, 1.0);
  output.normal = vec4<f32>(normal, 0.0);
  output.albedo = vec4<f32>(getAlbedo(texCoord), 0.0);
  output.rmao = vec4<f32>(material.roughness, material.metallic, material.ambientOcc, 0.0);
  return output;
}