import { Inject } from "@ipare/inject";
import inquirer from "inquirer";
import path from "path";
import { DepsService } from "../deps.service";
import * as fs from "fs";
import { PluginConfigService } from "./plugin-config.service";

export class PluginSelectService {
  @Inject
  private readonly depsService!: DepsService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;

  private get sourceDir() {
    return path.join(__dirname, "../../../template");
  }

  public async select(): Promise<string[]> {
    const pluginConfig = await this.pluginConfigService.getConfig();
    const { plugins } = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: pluginConfig.plugins.map<inquirer.DistinctChoice>((p) => ({
          value: p.name,
          name: p.desc,
          checked: p.default,
        })),
      },
    ]);
    return plugins;
  }

  public async sortPlugins(
    plugins: string[],
    ...paths: string[]
  ): Promise<string[]> {
    const result: string[] = [...plugins];
    const pkg = JSON.parse(
      await fs.promises.readFile(
        path.join(this.sourceDir, "package.json"),
        "utf-8"
      )
    );
    const { dependencies, devDependencies } = pkg;

    function add(plugin: string) {
      if (!result.includes(plugin)) {
        result.push(plugin);
      }
    }

    function addFromDeps(deps: any, plugin: string) {
      if (Object.keys(deps).some((dep) => dep == `@ipare/${plugin}`)) {
        add(plugin);
      }
    }

    plugins.forEach((plugin) => {
      addFromDeps(dependencies, plugin);
      addFromDeps(devDependencies, plugin);

      if (Object.keys(dependencies).some((dep) => dep == `@ipare/${plugin}`)) {
        this.depsService
          .getPackageIpareDeps(`@ipare/${plugin}`, paths)
          .map((item) => item.key.replace(/^@ipare\//, ""))
          .forEach((dep) => {
            add(dep);
          });
      }
    });
    return result;
  }
}
