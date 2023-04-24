// uniform definition of model info
// by chengtian.he
// 2023.4.16

#if !BGID_MODEL
#define BGID_MODEL 0
#endif

struct ModelInfo {
  modelTrans : mat4x4<f32>,
  normalTrans : mat3x3<f32>
}

@group(BGID_MODEL) @binding(0)
var<uniform> modelInfo : ModelInfo;