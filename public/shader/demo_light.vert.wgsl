@vertex
fn main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  const screenCorners = array(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
  );
  return vec4<f32>(screenCorners[vertexIndex], 0.0, 1.0);
}