// shader preprocessor
// by chengtian.he
// 2023.4.13

import axios from "axios";
import _ from "lodash";

import { combinePath } from "../util/path";
import { checkStatus } from "../util/http";

export type ShaderMacroDefintionList = { [key: string]: string };

export class ShaderPreprocessor {
  predefinedMacro: ShaderMacroDefintionList;

  constructor(predefinedMacro: ShaderMacroDefintionList = {}) {
    this.predefinedMacro = predefinedMacro;
  }

  async process(source: string, includePath: string) {
    source = await this.processInclude(source, includePath);
    let hasMacro = true;
    while (hasMacro) {
      const result = await this.processOnce(source);
      hasMacro = result[0];
      source = result[1];
    }
    source = this.processDefine(source);
    return source;
  }

  private static checkMacro(currentMacro: ShaderMacroDefintionList, macro: string) {
    if (!macro.startsWith("!")) return macro in currentMacro;
    else return !(macro.slice(1) in currentMacro);
  }

  private async processOnce(source: string): Promise<[boolean, string]> {
    let currentMacro = _.clone(this.predefinedMacro);
    let processed = "";
    let currentIfBlock = null;
    let currentIfMacro = null;
    let currentIfBlockCount = 0;
    let hasMacro = false;
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let tokens = lines[i].split(/\s/g);
      tokens = tokens.filter(v => v != "");
      let currentHasMacro = true;
      if (tokens[0] == "#if") {
        if (currentIfBlockCount == 0) {
          currentIfMacro = tokens[1];
          currentIfBlock = "";
        } else if (currentIfMacro != null) currentIfBlock += lines[i] + "\n"; else processed += lines[i] + "\n";
        currentIfBlockCount++;
      } else if (tokens[0] == "#endif") {
        if (currentIfMacro == null) {
          console.error("macro syntax error on line ", i + 1);
          console.error(source);
          return null;
        }
        if (currentIfBlockCount == 1) {
          if (ShaderPreprocessor.checkMacro(currentMacro, currentIfMacro)) processed += currentIfBlock;
          currentIfMacro = currentIfBlock = null;
        } else if (currentIfMacro != null) currentIfBlock += lines[i] + "\n"; else processed += lines[i] + "\n";
        currentIfBlockCount--;
      } else if (currentIfMacro == null && tokens[0] == "#define") {
        let macro = tokens[1];
        let value = tokens.length >= 3 && tokens[2].length > 0 ? tokens[2] : "1"
        currentMacro[macro] = value;
        currentHasMacro = false;
        if (currentIfMacro != null) currentIfBlock += lines[i] + "\n"; else processed += lines[i] + "\n";
      } else if (currentIfMacro == null && tokens[0] == "#undef") {
        if (tokens[1] in currentMacro) delete currentMacro[tokens[1]];
        if (currentIfMacro != null) currentIfBlock += lines[i] + "\n"; else processed += lines[i] + "\n";
      } else if (currentIfMacro != null) {
        currentIfBlock += lines[i] + "\n";
      } else {
        processed += lines[i] + "\n";
        currentHasMacro = false;
      }
      hasMacro = hasMacro || currentHasMacro;
    }
    if (currentIfBlockCount > 0) {
      console.error("macro if block not enclosed");
      console.error(source);
      return null;
    }
    return [hasMacro, processed];
  }

  async processInclude(source: string, includePath: string, expandedHeaders?: string[]) {
    let processed = "";
    let currentExpandedHeaders = expandedHeaders != undefined ? expandedHeaders : [];
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let tokens = lines[i].split(/\s+/g);
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

  processDefine(source: string) {
    let processed = "";
    let currentMacro = _.clone(this.predefinedMacro);
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let tokens = lines[i].split(/\s+/g);
      tokens = tokens.filter(v => v != "");
      if (tokens[0] == "#define") {
        let macro = tokens[1];
        let value = tokens.length >= 3 && tokens[2].length > 0 ? tokens[2] : "1"
        currentMacro[macro] = value;
      } else if (tokens[0] == "#undef") {
        if (tokens[1] in currentMacro) delete currentMacro[tokens[1]];
      } else {
        let processedLine = lines[i];
        Object.entries(currentMacro).forEach(p => processedLine = processedLine.replace(p[0], p[1]));
        processed += processedLine + "\n";
      }
    }
    return processed;
  }
}