import { Inject } from "@halsp/inject";
import { ExpressionService } from "./expression.service";
import { Context } from "@halsp/core";

// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s*\{\s*/;
// plugin end
const commentPluginEndRegExp = /^\s*\/{2,}\s*\}\s*/;
const uslessRegExp = /\/{2,}\s*\!\s*/;
const importRegExp =
  /^import\s((\"@halsp\/([^/]+?)((\")|(\/.+\")))|(.+?\sfrom\s(\"@halsp\/([^/]+?)((\")|(\/.+\")))));$/;
const commandRegExp = /\$\$\{\{([\s\S]*?)\}\}/;

export class ParseCodeService {
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly ctx!: Context;

  public parse(code: string, flags: string[]) {
    code = this.execCommand(code, flags);

    const lines = code.trimStart().replace(/\r\n/g, "\n").split("\n");

    this.removeCommentLine(lines, flags);
    this.removeImportLine(lines, flags);

    const lineEnd = code.includes("\r\n") ? "\r\n" : "\n";
    let result = lines.join(lineEnd).trimStart();
    result = this.replaceCode(result);
    if (!!result.trim()) {
      return result;
    } else {
      return "";
    }
  }

  private execCommand(code: string, flags: string[]) {
    while (true) {
      const regArr = commandRegExp.exec(code);
      if (!regArr) break;

      const command = regArr[1];

      const evalFn = (() => eval(command)).bind({
        ctx: this.ctx,
        flags,
      });

      code = code.replace(regArr[0], evalFn() ?? "");
    }

    while (true) {
      const regArr = /\\{1,2}\$\\{1,2}\$/.exec(code);
      if (!regArr) break;

      code = code.replace(regArr[0], () => "$$");
    }

    return code;
  }

  private removeImportLine(lines: string[], flags: string[]) {
    let importIndex = -1;
    while (true) {
      importIndex = lines.findIndex(
        (line, index) => index > importIndex && importRegExp.test(line),
      );
      if (importIndex < 0) {
        break;
      }
      const regArr = importRegExp.exec(lines[importIndex]) as RegExpExecArray;
      const importName = regArr[3] ?? regArr[9];
      const pkgName = (regArr[2] ?? regArr[8])
        .replace(/^\"/, "")
        .replace(/\"$/, "");
      if (!flags.includes(importName) && pkgName.startsWith("@halsp/")) {
        lines.splice(importIndex, 1);
        importIndex--;
      }
    }
  }

  private replaceCode(code: string) {
    const matchArr = code.match(/\/\*\s*replace([\s\S]+)*\*\//);
    if (!matchArr?.length) return code;

    code = code.replace(matchArr[0], "");
    const replaceContent = matchArr[1]
      .trim()
      .split("---")
      .map((item) => item.trim())
      .filter((item) => !!item);
    code = code.replace(replaceContent[0], replaceContent[1]);
    return code;
  }

  private removeCommentLine(lines: string[], flags: string[]) {
    while (true) {
      const index = lines.findIndex((line) => uslessRegExp.test(line));
      if (index < 0) {
        break;
      }

      lines.splice(index, 2);
    }

    while (true) {
      const start = lines.findIndex((line) =>
        commentPluginStartRegExp.test(line),
      );
      const end = this.findEndIndex(lines, start);
      if (start < 0 || end < 0) {
        break;
      }

      const expression = lines[start].replace(commentPluginStartRegExp, "");
      if (this.expressionService.calc(expression, flags)) {
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
}
