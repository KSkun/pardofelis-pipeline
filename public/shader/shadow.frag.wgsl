// shadow pass fragment shader
// by chengtian.he
// 2023.4.15

@fragment
fn main(@location(0) viewPos : vec3<f32>) -> @location(0) f32 {
  return length(viewPos);
}