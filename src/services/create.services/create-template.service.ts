import { Inject } from "@ipare/inject";
import path from "path";
import { FileService } from "../file.service";
import * as fs from "fs";
import walk from "ignore-walk";
import { ExpressionService } from "./expression.service";
import { CreateEnvService } from "./create-env.service";
import { CreatePluginService } from "./create-plugin.service";
import prettier from "prettier";
import { isPlugin, Plugin } from "../../utils/plugins";

// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s*\{\s*/;
// plugin end
const commentPluginEndRegExp = /^\s*\/{2,}\s*\}\s*/;
const importRegExp =
  /^import\s((\"@ipare\/([^/]+?)((\")|(\/.+\")))|(.+?\sfrom\s\"@ipare\/([^/]+?)((\")|(\/.+\"))));$/;
const uslessRegExp = /\/{2,}\s*\!\s*/;

export class CreateTemplateService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createPluginService!: CreatePluginService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }
  private get sourceDir() {
    return path.join(__dirname, "../../../template");
  }

  public async create(plugins: Plugin[]) {
    if (!fs.existsSync(this.sourceDir)) return;

    const exclude = await this.createPluginService.excludePluginFiles(plugins);
    let paths = await walk({
      path: this.sourceDir,
      ignoreFiles: [".gitignore", ".ipareignore"],
    });
    paths = paths.filter((p) => !exclude.some((e) => e == p));
    await this.copyTemplate(plugins, paths);
  }

  private async copyTemplate(plugins: Plugin[], paths: string[]) {
    for (const p of paths) {
      const sourceFile = path.join(this.sourceDir, p);
      let targetFile = path.join(this.targetDir, p);

      let content: string | null = await fs.promises.readFile(
        sourceFile,
        "utf-8"
      );
      content = this.readFile(content, plugins);
      if (content != null) {
        const renameInfo = this.getRename(content);
        if (targetFile.endsWith("_.get.ts")) {
          console.log("renameInfo", targetFile, renameInfo);
        }
        if (renameInfo) {
          content = renameInfo.code;
          targetFile = targetFile
            .replace(/\\/g, "/")
            .replace(/[^\/]+$/, renameInfo.rename);
          console.log("targetFile2", targetFile);
        }
        if (sourceFile.endsWith(".ts")) {
          content = prettier.format(content, {
            parser: "typescript",
          });
        }
        await this.fileService.createDir(targetFile);
        await fs.promises.writeFile(targetFile, content);
      }
    }
  }

  public readFile(code: string, plugins: Plugin[]): string | null {
    const lines = code.trimStart().replace(/\r\n/g, "\n").split("\n");

    this.removeCommentLine(lines, plugins);
    this.removeImportLine(lines, plugins);

    const lineEnd = code.includes("\r\n") ? "\r\n" : "\n";
    const result = lines.join(lineEnd).trimStart();
    if (!!result.trim()) {
      return this.replaceCode(result);
    } else {
      return null;
    }
  }

  private removeCommentLine(lines: string[], plugins: Plugin[]) {
    while (true) {
      const index = lines.findIndex((line) => uslessRegExp.test(line));
      if (index < 0) {
        break;
      }

      lines.splice(index, 2);
    }
    while (true) {
      const start = lines.findIndex((line) =>
        commentPluginStartRegExp.test(line)
      );
      const end = this.findEndIndex(lines, start);
      if (start < 0 || end < 0) {
        break;
      }

      const expression = lines[start].replace(commentPluginStartRegExp, "");
      if (this.expressionService.calcPlugins(expression, plugins)) {
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
      const importName = (regArr[3] ?? regArr[8]) as Plugin;
      if (!plugins.includes(importName) && isPlugin(importName)) {
        lines.splice(importIndex, 1);
        importIndex--;
      }
    }
  }

  private getRename(code: string) {
    if (!code.match(/\/\*\s*rename/)) {
      return;
    }

    const matchArr = code.match(/\/\*\s*rename([\s\S]+)*\*\//);
    if (!matchArr?.length) return;

    code = code.replace(matchArr[0], "");
    return {
      code,
      rename: matchArr[1]?.trim(),
    };
  }

  private replaceCode(code: string) {
    if (!code.match(/\/\*\s*replace/)) {
      return code;
    }

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
}
