import _ from "lodash";
import { UniformProperty } from "./property";

export class UniformPropertyArray extends UniformProperty {
  maxLength: number;
  length: number;
  elePrototype: UniformProperty;
  elePadding: number;

  constructor(elePrototype: UniformProperty, maxLength: number) {
    super();
    this.type = "array";
    this.elePrototype = elePrototype;
    this.maxLength = maxLength;
    this.length = 0;
    this.alignment = this.elePrototype.alignment;
    this.elePadding = 0;
    if (this.elePrototype.size % this.elePrototype.alignment != 0)
      this.elePadding = this.elePrototype.alignment - this.elePrototype.size % this.elePrototype.alignment;
    this.size = this.maxLength * (this.elePrototype.size + this.elePadding);

    this.value = [];
    for (let i = 0; i < this.maxLength; i++) {
      this.value.push(_.cloneDeep(this.elePrototype));
    }
  }

  set(value: any) {
    this.length = Math.min(value.length, this.maxLength);
    for (let i = 0; i < this.length; i++) {
      this.value[i].set(value[i]);
    }
  }
  
  add(value: any) {
    this.length++;
    this.value[this.length - 1].set(value);
  }

  writeBuffer(buffer: ArrayBuffer, offset: number) {
    for (let i = 0; i < this.length; i++) {
      this.value[i].writeBuffer(buffer, offset + i * (this.elePrototype.size + this.elePadding));
    }
  }
}