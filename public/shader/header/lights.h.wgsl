// struct definition of lights
// by chengtian.he
// 2023.4.21

// point light

const pointLightNumMax = 10;

struct PointLightParam {
  worldPos : vec3<f32>,
  color : vec3<f32>
}

struct PointLightArray {
  size : u32,
  arr : array<PointLightParam, pointLightNumMax>
}

// directional light

const dirLightNumMax = 10;

struct DirLightParam {
  worldPos : vec3<f32>,
  direction : vec3<f32>,
  color : vec3<f32>,
  shadowViewProj : mat4x4<f32>
}

struct DirLightArray {
  size : u32,
  arr : array<DirLightParam, dirLightNumMax>
}