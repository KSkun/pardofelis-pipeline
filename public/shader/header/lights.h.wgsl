// struct definition of lights
// by chengtian.he
// 2023.4.21

// point light

struct PointLightParam {
  worldPos : vec3<f32>,
  color : vec3<f32>
}

// directional light

struct DirLightParam {
  worldPos : vec3<f32>,
  direction : vec3<f32>,
  color : vec3<f32>,
  shadowViewProj : mat4x4<f32>
}