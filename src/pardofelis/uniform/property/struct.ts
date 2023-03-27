import { isInUniformBuffer, UniformProperty } from "./property";

export class UniformPropertyStruct extends UniformProperty {
  properties: {[key: string]: UniformProperty};
  offsets: number[];

  constructor(properties: {[key: string]: UniformProperty}) {
    super();
    this.type = "struct";
    this.properties = properties;
    this.calculateOffsets();
  }

  private calculateOffsets() {
    this.alignment = -1;
    this.offsets = [];
    let curOffset = 0;
    let keys = Object.keys(this.properties);
    for (let i = 0; i < keys.length; i++) {
      let p = this.properties[keys[i]];
      this.alignment = Math.max(this.alignment, p.alignment);
      if (!isInUniformBuffer(p.type)) {
        console.error("struct cannot contain field not in uniform buffer, when evaluating", p, "in", this);
        throw new Error("struct cannot contain field not in uniform buffer");
      }
      if (curOffset % p.alignment != 0)
        curOffset += p.alignment - curOffset % p.alignment;
      this.offsets.push(curOffset);
      curOffset += p.size;
    }
    this.size = curOffset;
  }

  set(value: any) {
    let keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] in this.properties) {
        this.properties[keys[i]].set(value[keys[i]]);
      }
    }
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    let keys = Object.keys(this.properties);
    for (let i = 0; i < keys.length; i++) {
      this.properties[keys[i]].writeBuffer(buffer, offset + this.offsets[i]);
    }
  }
}