import { HttpContext } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import { ExpressionService } from "./expression.service";
import { Plugin } from "./plugin-select.service";
import * as fs from "fs";

export class CreatePackageService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly createEnvService!: CreateEnvService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public create(plugins: Plugin[]): void {
    const pkg = this.getPackage();
    const pluginConfig = this.getPluginConfig(plugins);

    pkg.name = this.name;

    this.removeDeps(pkg.dependencies, plugins, pluginConfig);
    this.removeDeps(pkg.devDependencies, plugins, pluginConfig);

    const filePath = path.join(this.targetDir, "package.json");
    fs.writeFileSync(filePath, JSON.stringify(pkg));
  }

  private removeDeps(
    deps: Record<string, string>,
    plugins: Plugin[],
    pluginConfig: Record<string, boolean>
  ) {
    Object.keys(deps)
      .filter((k) => !plugins.some((p) => `@sfajs/${p}` == k))
      .forEach((key) => {
        delete deps[key];
      });

    Object.keys(deps)
      .filter((k) => pluginConfig[k] == false)
      .forEach((key) => {
        delete deps[key];
      });
  }

  private getPluginConfig(plugins: Plugin[]) {
    const file = path.join(__dirname, "../../template/package.plugin.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config: Record<string, string | boolean> = require(file);

    for (const key in config) {
      const value = config[key] as string;
      const newValue = this.expressionService.calcPlugins(value, plugins);
      config[key] = newValue;
    }

    return config as Record<string, boolean>;
  }

  private getPackage(): any {
    const file = path.join(__dirname, "../../template/package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(file);
  }
}
