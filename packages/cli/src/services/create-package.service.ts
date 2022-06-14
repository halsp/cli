import { HttpContext } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import * as fs from "fs";
import { PackageManagerService } from "./package-manager.service";
import {
  CreatePluginService,
  FixedPluginConfig,
} from "./create-plugin.service";
import prettier from "prettier";
import { Plugin } from "../utils/plugins";
import { CommandService } from "./command.service";

export class CreatePackageService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly createPluginService!: CreatePluginService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly commandService!: CommandService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public async create(plugins: Plugin[]): Promise<void> {
    const pkg = this.getPackage();
    const pluginConfig = await this.createPluginService.getPluginConfig(
      plugins
    );

    this.setDeps(pkg.dependencies, plugins, pluginConfig);
    this.setDeps(pkg.devDependencies, plugins, pluginConfig);

    this.setCliVersion(pkg);
    pkg.name = this.name;

    const filePath = path.join(this.targetDir, "package.json");
    await fs.promises.writeFile(
      filePath,
      prettier.format(JSON.stringify(pkg), {
        parser: "json",
      })
    );

    const pm = await this.packageManagerService.pickPackageManager();
    await this.packageManagerService.install(pm, this.targetDir);
    this.ctx.bag("PACKAGE_MANAGER", pm);
  }

  private setDeps(
    deps: Record<string, string>,
    plugins: Plugin[],
    pluginConfig: FixedPluginConfig
  ) {
    const { constant, dependencies } = pluginConfig;

    Object.keys(deps)
      .filter((k) => k.startsWith("@sfajs/"))
      .filter((k) => !constant.some((c) => `@sfajs/${c}` == k))
      .filter((k) => !plugins.some((p) => `@sfajs/${p}` == k))
      .forEach((key) => {
        delete deps[key];
      });

    Object.keys(deps)
      .filter((k) => dependencies[k] == false)
      .forEach((key) => {
        delete deps[key];
      });
  }

  private getPackage(): any {
    const file = path.join(__dirname, "../../template/package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(file);
  }

  private setCliVersion(pkg: Record<string, any>): any {
    const version = this.commandService.getOptionVlaue<string>([
      "cli-version",
      "cliVersion",
    ]);

    if (Object.keys(pkg.dependencies).includes("@sfajs/cli")) {
      pkg.dependencies["@sfajs/cli"] = `^${version}`;
    }
    if (Object.keys(pkg.devDependencies).includes("@sfajs/cli")) {
      pkg.devDependencies["@sfajs/cli"] = `^${version}`;
    }
  }
}
