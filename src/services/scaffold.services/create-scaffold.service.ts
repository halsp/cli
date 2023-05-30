import { Inject } from "@halsp/inject";
import path from "path";
import { FileService } from "../file.service";
import * as fs from "fs";
import walk from "ignore-walk";
import { ExpressionService } from "./expression.service";
import prettier from "prettier";
import { PackageManagerService } from "../package-manager.service";
import { CommandService } from "../command.service";
import { SortPluginsService } from "./sort-plugins.service";
import { ExpressionObject, PluginConfigService } from "./plugin-config.service";
import { glob } from "glob";
import { Ctx } from "@halsp/pipe";
import { Context } from "@halsp/core";
import { ChalkService } from "../chalk.service";
import { CopyIgnoreService } from "./copy-ignore.service";
import { CreateService } from "../create.service";

// plugin inject|router
const commentPluginStartRegExp = /^\s*\/{2,}\s*\{\s*/;
// plugin end
const commentPluginEndRegExp = /^\s*\/{2,}\s*\}\s*/;
const importRegExp =
  /^import\s((\"@halsp\/([^/]+?)((\")|(\/.+\")))|(.+?\sfrom\s(\"@halsp\/([^/]+?)((\")|(\/.+\")))));$/;
const uslessRegExp = /\/{2,}\s*\!\s*/;

export class CreateScaffoldService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;
  @Ctx
  private readonly ctx!: Context;
  @Inject
  private readonly chalkService!: ChalkService;
  @Inject
  private readonly copyIgnoreService!: CopyIgnoreService;
  @Inject
  private readonly createService!: CreateService;

  private get targetDir() {
    return this.createService.targetDir;
  }
  private get sourceDir() {
    return path.join(__dirname, "../../../scaffold");
  }

  public async create(plugins: string[], ...exFlags: string[]) {
    if (!fs.existsSync(this.sourceDir)) return;

    plugins = await this.sortPlugins(plugins);

    const ignoreFiles = await this.getIgnoreFiles(plugins);
    let paths = await walk({
      path: this.sourceDir,
      ignoreFiles: this.copyIgnoreService.getIgnoreFiles(),
    });
    paths = paths
      .map((item) => item.replace(/\\/g, ""))
      .filter((p) => !ignoreFiles.some((e) => e == p));

    const flags = [...plugins, ...exFlags];
    await this.copyTemplate(flags, paths);
    await this.copyIgnoreService.create();
  }

  private async copyTemplate(flags: string[], paths: string[]) {
    for (const p of paths) {
      const sourceFile = path.join(this.sourceDir, p);
      let targetFile = path.join(this.targetDir, p);

      let content: string | null = await fs.promises.readFile(
        sourceFile,
        "utf-8"
      );
      content = this.readFile(content, flags);
      const renameInfo = this.getRename(content);
      if (renameInfo) {
        content = renameInfo.code;
        if (renameInfo.rename) {
          targetFile = targetFile
            .replace(/\\/g, "/")
            .replace(/[^\/]+$/, renameInfo.rename);
        }
      }
      if (!!content.trim()) {
        if (sourceFile.endsWith(".ts")) {
          content = prettier.format(content, {
            parser: "typescript",
          }) as string;
        }
        await this.fileService.createDir(targetFile);
        await fs.promises.writeFile(targetFile, content);
      }
    }
  }

  private readFile(code: string, flags: string[]): string {
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

  private async removeCommentLine(lines: string[], flags: string[]) {
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
      if (this.expressionService.calcPlugins(expression, flags)) {
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

  private removeImportLine(lines: string[], flags: string[]) {
    let importIndex = -1;
    while (true) {
      importIndex = lines.findIndex(
        (line, index) => index > importIndex && importRegExp.test(line)
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

  private getRename(code: string) {
    const matchArr = code.match(/\/\*\s*rename([\s\S]+)\*\//);
    if (!matchArr?.length) return;

    code = code.replace(matchArr[0], "");
    return {
      code,
      rename: matchArr[1].trim(),
    };
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

  public async init(pm: string) {
    const cliVersion = getCliVersion();
    const initFlatFilePath = path.join(
      __dirname,
      "../../../scaffold/node_modules",
      cliVersion
    );
    if (this.commandService.getOptionVlaue<boolean>("forceInit")) {
      this.ctx.logger.info(
        this.chalkService.magentaBright("Force init scaffold. Please wait...")
      );
    } else {
      if (fs.existsSync(initFlatFilePath)) {
        return true;
      }
      this.ctx.logger.info(
        this.chalkService.magentaBright(
          "The command is used for the first time and is being initialized. Please wait..."
        )
      );
    }

    const installResult = this.packageManagerService.install(
      pm,
      path.join(__dirname, "../../../scaffold")
    );
    if (installResult.status == 0) {
      await fs.promises.writeFile(initFlatFilePath, cliVersion);
    }
    return installResult.status == 0;
  }

  private async sortPlugins(plugins: string[]) {
    const pluginConfig = await this.pluginConfigService.getSortedConfig(
      plugins
    );
    plugins = [...plugins];

    function addFromConfig(config: ExpressionObject<boolean>) {
      Object.keys(config)
        .filter((k) => k.startsWith("@halsp/"))
        .filter((k) => config[k] == true)
        .map((k) => k.replace(/^@halsp\//, ""))
        .forEach((k) => plugins.push(k));
    }

    addFromConfig(pluginConfig.dependencies);
    addFromConfig(pluginConfig.devDependencies);

    plugins = await this.sortPluginsService.sortPlugins(plugins, false);
    plugins.push("cli");
    return plugins;
  }

  private async getIgnoreFiles(plugins: string[]) {
    const { files } = await this.pluginConfigService.getSortedConfig(plugins);
    const result: string[] = [];
    for (const excludes in files) {
      if (files[excludes]) {
        continue;
      }

      const paths = await glob(excludes, {
        cwd: this.sourceDir,
        dot: true,
        nodir: true,
      });
      result.push(...paths);
    }
    return result.map((item) => item.replace(/\\/g, "/"));
  }
}

function getCliVersion() {
  const file = path.join(__dirname, "../../../package.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(file).version;
}
