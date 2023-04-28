// compute pass before draw cmd (mainly culling)
// by chengtian.he
// 2023.4.28

#define BGID_COMP 0
#define BGID_INSTCOMP 1

#include "u_comp.h.wgsl"
#include "u_comp_inst.h.wgsl"

@compute @workgroup_size(10)
fn main(@builtin(global_invocation_id) invID : vec3<u32>) {
  var instOffset = invID.x * perWgInstanceNum;
  if (instOffset >= instanceNum) { return; }
  var instNum = min(perWgInstanceNum, instanceNum - instOffset);
  var viewProjTrans = cullInfo.projTrans * cullInfo.viewTrans;

  for (var i = 0u; i < instNum; i++) {
    var instIdx = i + instOffset;
    var instInfo = instances[instIdx];
    var bbox : BoundingBox;
    bbox.min = instInfo.bboxMin;
    bbox.max = instInfo.bboxMax;
    bbox = transformBBox(bbox, instInfo.modelTrans);
    var ndcBBox : BoundingBox;
    ndcBBox = transformBBox(bbox, viewProjTrans);

    // culling
    var testCull : bool = (instInfo.isIgnored == 0u);
    if (testCull && !testCullDistance(bbox, cullInfo.cameraPos, cullInfo.cullDistance)) {
      testCull = false;
    }
    // if (testCull && !testCullFrustum(bbox, cullInfo.cameraPos, cullInfo.cullDistance)) {
    //   testCull = false;
    // }

    cmdBuffer[instInfo.cmdBufferIndex].indexCount = instInfo.indexCount;
    if (!testCull) { cmdBuffer[instInfo.cmdBufferIndex].indexCount = 0u; }
    cmdBuffer[instInfo.cmdBufferIndex].instanceCount = 1u;
    cmdBuffer[instInfo.cmdBufferIndex].firstIndex = instInfo.indexOffset;
    cmdBuffer[instInfo.cmdBufferIndex].baseVertex = 0u;
    cmdBuffer[instInfo.cmdBufferIndex].firstInstance = instInfo.instanceIndex;
  }
}