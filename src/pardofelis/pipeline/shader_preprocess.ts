// shader preprocessor
// by chengtian.he
// 2023.4.13

import axios from "axios";
import _ from "lodash";

import { combinePath } from "../util/path";
import { checkStatus } from "../util/http";

export class ShaderPreprocessor {
  predefinedMacro: string[];
  currentMacro: string[];

  constructor(predefinedMacro: string[] = []) {
    this.predefinedMacro = predefinedMacro;
  }

  async processInclude(source: string, includePath: string, expandedHeaders?: string[]) {
    let processed = "";
    let currentExpandedHeaders = expandedHeaders != undefined ? expandedHeaders : [];
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let tokens = lines[i].split(/\s/g);
      tokens = tokens.filter(v => v != "");
      if (tokens[0] == "#include") {
        const includeFileName = /"(.+)"/g.exec(tokens[1])[1];
        if (!currentExpandedHeaders.includes(includeFileName)) {
          const includeFilePath = combinePath(includePath, includeFileName);
          const rsp = await axios.get(includeFilePath, { responseType: "text", validateStatus: () => true });
          if (!checkStatus(rsp)) {
            console.error("get macro include file error on line ", i + 1);
            console.error(source);
            return null;
          }
          processed += "\n// begin " + includeFileName + "\n";
          processed += await this.processInclude(rsp.data, includePath, currentExpandedHeaders);
          processed += "\n// end " + includeFileName + "\n";
          currentExpandedHeaders.push(includeFileName);
        }
      } else {
        processed += lines[i] + "\n";
      }
    }
    return processed;
  }

  async process(source: string, includePath: string) {
    source = await this.processInclude(source, includePath);
    this.currentMacro = _.clone(this.predefinedMacro);
    let processed = "";
    let currentIfBlock = null;
    let currentIfMacro = null;
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let tokens = lines[i].split(/\s/g);
      tokens = tokens.filter(v => v != "");
      if (tokens[0] == "#if") {
        currentIfMacro = tokens[1];
        currentIfBlock = "";
      } else if (tokens[0] == "#endif") {
        if (currentIfMacro == null) {
          console.error("macro syntax error on line ", i + 1);
          console.error(source);
          return null;
        }
        if (this.currentMacro.includes(currentIfMacro)) processed += currentIfBlock;
        currentIfMacro = currentIfBlock = null;
      } else if (tokens[0] == "#elseif") {
        if (currentIfMacro == null) {
          console.error("macro syntax error on line ", i + 1);
          console.error(source);
          return null;
        }
        if (this.currentMacro.includes(currentIfMacro)) processed += currentIfBlock;
        currentIfMacro = tokens[1];
        currentIfBlock = "";
      } else if (tokens[0] == "#define") {
        this.currentMacro.push(tokens[1]);
      } else if (tokens[0] == "#undef") {
        this.currentMacro = this.currentMacro.filter(m => m != tokens[1]);
      } else {
        processed += lines[i] + "\n";
      }
    }
    if (currentIfMacro != null && this.currentMacro.includes(currentIfMacro)) {
      console.warn("macro if block not enclosed");
      console.warn(source);
      processed += currentIfBlock;
    }
    return processed;
  }
}