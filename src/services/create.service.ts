import { Inject } from "@sfajs/inject";
import path from "path";
import { FileService } from "./file.service";

export const commentStartRegExp = /^\s*\/{2,}\s+/;
export const commentLineRegExp = /^\s*\/{2,}\s+.+/;

// plugin core
// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s+plugin\s+/;
// plugin-end
const commentPluginEndRegExp = /^\s*\/{2,}\s+plugin-end\s*/;

export type Plugin =
  | "inject"
  | "router"
  | "views"
  | "mva"
  | "pipe"
  | "filter"
  | "testing"
  | "static"
  | "swagger"
  | "jwt";

export class CreateService {
  @Inject
  private readonly fileService!: FileService;

  public create(plugins: Plugin[], targetDir: string) {
    const source = path.join(__dirname, "../../template/project");
    this.fileService.copyCode(source, targetDir, (code) =>
      this.readFile(code, plugins)
    );
  }

  private readFile(code: string, plugins: Plugin[]): string | null {
    const lines = code.trimStart().replace(/\r\n/g, "").split("\n");

    while (true) {
      const start = lines.findIndex((line) =>
        commentPluginStartRegExp.test(line)
      );
      const end =
        lines.length -
        1 -
        [...lines]
          .reverse()
          .findIndex((line) => commentPluginEndRegExp.test(line));
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
    if (codeTypes.includes("core")) {
      return true;
    }

    return Object.keys(plugins)
      .filter((key) => !!plugins[key])
      .some((key) => codeTypes.some((type) => type == key));
  }
}
