// uniform definition of compute shader instance info
// by chengtian.he
// 2023.4.28

#include "predraw.h.wgsl"

struct DrawIndexedIndirectCmd {
  indexCount : u32,
  instanceCount : u32,
  firstIndex : u32,
  baseVertex : u32,
  firstInstance : u32
}

@group(BGID_INSTCOMP) @binding(0)
var<storage, read_write> cmdBuffer : array<DrawIndexedIndirectCmd>;

struct InstanceInfo {
  bboxMin : vec3<f32>,
  bboxMax : vec3<f32>,
  modelTrans : mat4x4<f32>,
  cmdBufferIndex : u32,
  instanceIndex : u32,
  indexOffset : u32,
  indexCount : u32,
  isIgnored : u32
}

@group(BGID_INSTCOMP) @binding(1)
var<uniform> perWgInstanceNum : u32;
@group(BGID_INSTCOMP) @binding(2)
var<uniform> instanceNum : u32;
@group(BGID_INSTCOMP) @binding(3)
var<storage, read> instances : array<InstanceInfo>;
