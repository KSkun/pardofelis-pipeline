struct MtxMVP {
  model : mat4x4<f32>,
  view : mat4x4<f32>,
  proj : mat4x4<f32>,
  modelView : mat4x4<f32>,
  modelViewProj : mat4x4<f32>
}

struct VertOutput {
  @builtin(position) Pos : vec4<f32>,
  @location(0) WorldPos : vec3<f32>
}

@group(0) @binding(0) var<uniform> mtxMVP : MtxMVP;

@vertex
fn main(@location(0) pos : vec4<f32>) -> VertOutput {
  var output : VertOutput;
  output.Pos = mtxMVP.modelViewProj * pos;
  output.WorldPos = (mtxMVP.model * pos).xyz;
  return output;
}