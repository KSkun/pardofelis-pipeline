const pointLightNumMax = 10;

struct MaterialParam {
  color : vec3<f32>,
  roughness : f32,
  metallic : f32,
  ambientOcc : f32
}

struct PointLightParam {
  worldPos : vec3<f32>,
  color : vec3<f32>
}

struct PointLightArray {
  pointLightNum : u32,
  pointLights : array<PointLightParam, pointLightNumMax>
}

@group(0) @binding(1)
var<uniform> cameraPos : vec3<f32>;

@group(1) @binding(0)
var<uniform> material : MaterialParam;

@group(2) @binding(0)
var<uniform> pointLights : PointLightArray;

@fragment
fn main(
  @location(0) worldPos : vec3<f32>,
  @location(1) normal : vec3<f32>
) -> @location(0) vec4<f32> {
  var t1 = cameraPos;
  var t2 = material;
  var t3 = pointLights;
  return vec4<f32>(normal, 1.0);
}