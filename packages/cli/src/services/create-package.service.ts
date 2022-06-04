import { HttpContext } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import { ExpressionService } from "./expression.service";
import { Plugin } from "./plugin-select.service";
import * as fs from "fs";
import { PackageManagerService } from "./package-manager.service";

type PluginConfig = {
  dependencies: Record<string, string | boolean | undefined>;
  constant: string[];
};
type FixedPluginConfig = {
  dependencies: Record<string, boolean | undefined>;
  constant: string[];
};

export class CreatePackageService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public async create(plugins: Plugin[]): Promise<void> {
    const pkg = this.getPackage();
    const pluginConfig = this.getPluginConfig(plugins);

    this.setDeps(pkg.dependencies, plugins, pluginConfig);
    this.setDeps(pkg.devDependencies, plugins, pluginConfig);

    this.setCliVersion(pkg);
    pkg.name = this.name;

    const filePath = path.join(this.targetDir, "package.json");
    await fs.promises.writeFile(filePath, JSON.stringify(pkg));

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
      .filter((k) => k.startsWith("@sfajs/"))
      .filter((k) => !constant.some((c) => `@sfajs/${c}` == k))
      .filter((k) => dependencies[k] == false)
      .forEach((key) => {
        delete deps[key];
      });
  }

  private getPluginConfig(plugins: Plugin[]) {
    const file = path.join(__dirname, "../../template/package.plugin.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config: PluginConfig = require(file);

    for (const key in config.dependencies) {
      const value = config.dependencies[key] as string;
      const newValue = this.expressionService.calcPlugins(value, plugins);
      config.dependencies[key] = newValue;
    }

    return config as FixedPluginConfig;
  }

  private getPackage(): any {
    const file = path.join(__dirname, "../../template/package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(file);
  }

  private setCliVersion(pkg: Record<string, any>): any {
    const file = path.join(__dirname, "../../package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cliPkg = require(file);
    const version = cliPkg.version;

    if (Object.keys(pkg.dependencies).includes("@sfajs/cli")) {
      pkg.dependencies["@sfajs/cli"] = `^${version}`;
    }
    if (Object.keys(pkg.devDependencies).includes("@sfajs/cli")) {
      pkg.devDependencies["@sfajs/cli"] = `^${version}`;
    }
  }
}
