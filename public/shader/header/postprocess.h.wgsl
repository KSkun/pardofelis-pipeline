// common postprocess functions
// by chengtian.he
// 2023.4.13

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