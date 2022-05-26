import { Inject } from "@sfajs/inject";
import path from "path";
import { FileService } from "./file.service";
import { Plugin } from "./plugin-select.service";

// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s*\{\s*/;
// plugin-end
const commentPluginEndRegExp = /^\s*\/{2,}\s*\}\s*/;
const importRegExp =
  /^import\s(\"@sfajs\/(.+?)\")|(.+?\sfrom\s\"@sfajs\/(.+?)\");$/;

export class CreateTemplateService {
  @Inject
  private readonly fileService!: FileService;

  public create(plugins: Plugin[], targetDir: string, source?: string) {
    if (!source) {
      source = path.join(__dirname, "../../template/project");
    }
    this.fileService.copyCode(
      source,
      targetDir,
      (code) => this.readFile(code, plugins),
      true
    );
    this.fileService.removeBlankDir(targetDir);
  }

  private readFile(code: string, plugins: Plugin[]): string | null {
    const lines = code.trimStart().replace(/\r\n/g, "\n").split("\n");

    this.removeCommentLine(lines, plugins);
    this.removeImportLine(lines, plugins);

    const lineEnd = code.includes("\r\n") ? "\r\n" : "\n";
    return lines.join(lineEnd).trimStart();
  }

  private removeCommentLine(lines: string[], plugins: Plugin[]) {
    while (true) {
      const start = lines.findIndex((line) =>
        commentPluginStartRegExp.test(line)
      );
      const end = this.findEndIndex(lines, start);
      if (start < 0 || end < 0) {
        break;
      }

      const expression = lines[start].replace(commentPluginStartRegExp, "");
      if (this.calcExpression(expression, plugins)) {
        lines.splice(end, 1);
        lines.splice(start, 1);
      } else {
        lines.splice(start, end - start + 1);
      }
    }
  }

  private findEndIndex(lines: string[], startIndex: number) {
    let children = 0;
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (commentPluginStartRegExp.test(lines[i])) {
        children++;
      }
      if (commentPluginEndRegExp.test(lines[i])) {
        children--;
      }
      if (children < 0) {
        return i;
      }
    }
    return -1;
  }

  private removeImportLine(lines: string[], plugins: Plugin[]) {
    let importIndex = -1;
    while (true) {
      importIndex = lines.findIndex(
        (line, index) => index > importIndex && importRegExp.test(line)
      );
      if (importIndex < 0) {
        break;
      }
      const regArr = importRegExp.exec(lines[importIndex]) as RegExpExecArray;
      const importName = (regArr[2] ?? regArr[4]) as Plugin;
      if (!plugins.includes(importName)) {
        lines.splice(importIndex, 1);
      }
    }
  }

  private calcExpression(expression: string, plugins: Plugin[]) {
    plugins.forEach((plugin) => {
      expression = expression.replace(new RegExp(plugin, "g"), "↑");
    });
    expression = expression.replace(/[a-zA-Z]+/g, "false");
    expression = expression.replace(new RegExp("↑", "g"), "true");
    return eval(expression) as boolean;
  }
}
