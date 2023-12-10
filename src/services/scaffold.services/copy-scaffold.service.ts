import { Inject } from "@halsp/inject";
import path from "path";
import { FileService } from "../file.service";
import * as fs from "fs";
import walk from "ignore-walk";
import prettier from "prettier";
import { SortPluginsService } from "./sort-plugins.service";
import { ExpressionObject, PluginConfigService } from "./plugin-config.service";
import { glob } from "glob";
import { CopyIgnoreService } from "./copy-ignore.service";
import { CreateService } from "../create.service";
import { ParseCodeService } from "./parse-code.service";
import { createDirname } from "../../utils/shims";

const __dirname = createDirname(import.meta.url);

export class CopyScaffoldService {
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly parseCodeService!: ParseCodeService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;
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
        "utf-8",
      );
      content = this.parseCodeService.parse(content, flags);
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
          content = (await prettier.format(content, {
            parser: "typescript",
          })) as string;
        }
        await this.fileService.createDir(targetFile);
        await fs.promises.writeFile(targetFile, content);
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

  private async sortPlugins(plugins: string[]) {
    const pluginConfig =
      await this.pluginConfigService.getSortedConfig(plugins);
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
