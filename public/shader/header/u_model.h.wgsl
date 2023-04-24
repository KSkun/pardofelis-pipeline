// uniform definition of model info
// by chengtian.he
// 2023.4.16

#if !BGID_MODEL
#define BGID_MODEL 0
#endif

const instanceArrayMaxSize = 10;

struct ModelInfo {
  modelTrans : mat4x4<f32>,
  normalTrans : mat3x3<f32>
}

struct ModelInfoArray {
  size : u32,
  arr : array<ModelInfo, instanceArrayMaxSize>
}

@group(BGID_MODEL) @binding(0)
var<uniform> modelInfoArr : ModelInfoArray;