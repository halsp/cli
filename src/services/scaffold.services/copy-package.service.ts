import { Context } from "@halsp/core";
import { Inject } from "@halsp/inject";
import path from "path";
import * as fs from "fs";
import prettier from "prettier";
import { CommandService } from "../command.service";
import {
  PluginConfigService,
  SortedPluginConfig,
} from "./plugin-config.service";
import { CreateService } from "../create.service";
import { FileService } from "../file.service";

export class CopyPackageService {
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly fileService!: FileService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createService.targetDir;
  }

  public async create(plugins: string[]): Promise<void> {
    const pkg = this.getPackage();
    const pluginConfig =
      await this.pluginConfigService.getSortedConfig(plugins);

    this.setDeps(pkg.dependencies, plugins, pluginConfig, false);
    this.setDeps(pkg.devDependencies, plugins, pluginConfig, true);
    this.setCommonJS(pkg);
    this.setCliVersion(pkg);
    pkg.name = this.name;
    pkg.version = this.getCurrentVersion().replace(/^\^/, "");

    const filePath = path.join(this.targetDir, "package.json");
    await this.fileService.createParentDir(filePath);
    await fs.promises.writeFile(
      filePath,
      await prettier.format(JSON.stringify(pkg), {
        parser: "json",
      }),
    );
  }

  private setDeps(
    deps: Record<string, string>,
    plugins: string[],
    pluginConfig: SortedPluginConfig,
    isDev: boolean,
  ) {
    if (!deps) return;

    const { dependencies, devDependencies } = pluginConfig;

    Object.keys(deps)
      .filter((k) => k.startsWith("@halsp/"))
      .filter((k) => k != "@halsp/cli")
      .filter((k) => !plugins.some((p) => `@halsp/${p}` == k))
      .filter((k) => {
        if (isDev) {
          return devDependencies[k] != true;
        } else {
          return dependencies[k] != true;
        }
      })
      .forEach((key) => {
        delete deps[key];
      });

    Object.keys(deps)
      .filter((k) => {
        if (isDev) {
          return devDependencies[k] == false;
        } else {
          return dependencies[k] == false;
        }
      })
      .forEach((key) => {
        delete deps[key];
      });
  }

  private getPackage(): any {
    const file = path.join(__dirname, "../../../scaffold/package.json");
    return _require(file);
  }

  private setCliVersion(pkg: Record<string, any>) {
    const version = this.getCurrentVersion();
    if (
      pkg.dependencies &&
      Object.keys(pkg.dependencies).includes("@halsp/cli")
    ) {
      pkg.dependencies["@halsp/cli"] = version;
    }
    if (
      pkg.devDependencies &&
      Object.keys(pkg.devDependencies).includes("@halsp/cli")
    ) {
      pkg.devDependencies["@halsp/cli"] = version;
    }
  }

  private getCurrentVersion() {
    const debug = this.commandService.getOptionVlaue<boolean>("debug", false);
    if (debug) {
      return path.join(__dirname, "../../..");
    }

    const file = path.join(__dirname, "../../../package.json");
    return _require(file).version;
  }

  private setCommonJS(pkg: Record<string, any>) {
    const commonjs = this.commandService.getOptionVlaue<boolean>(
      "commonjs",
      false,
    );
    if (commonjs) {
      pkg.type = "commonjs";
    } else {
      pkg.type = "module";
    }
  }
}
