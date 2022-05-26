import { Inject } from "@sfajs/inject";
import path from "path";
import { FileService } from "./file.service";
import { Plugin } from "./plugin.service";

// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s*\{\s+/;
// plugin-end
const commentPluginEndRegExp = /^\s*\/{2,}\s*\}\s*/;

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
    const lines = code.trimStart().replace(/\r\n/g, "").split("\n");

    while (true) {
      const start = lines.findIndex((line) =>
        commentPluginStartRegExp.test(line)
      );
      const end = lines.findIndex((line) => commentPluginEndRegExp.test(line));
      if (start < 0 || end < 0) {
        break;
      }

      const types = lines[start].replace(commentPluginStartRegExp, "");
      if (this.isCodeSelected(types, plugins)) {
        lines.splice(end, 1);
        lines.splice(start, 1);
      } else {
        lines.splice(start, end - start + 1);
      }
    }

    const lineEnd = code.includes("\r\n") ? "\r\n" : "\n";
    return lines.join(lineEnd).trimStart();
  }

  private isCodeSelected(types: string, plugins: Plugin[]) {
    const codeTypes = types.trim().split("|");
    return plugins.some((key) => {
      return codeTypes.some((type) => {
        if (type.includes("-")) {
          const parents = type.split("-").splice(1);
          return !parents.some((p) => plugins.some((item) => item == p));
        } else {
          return key == type;
        }
      });
    });
  }
}
