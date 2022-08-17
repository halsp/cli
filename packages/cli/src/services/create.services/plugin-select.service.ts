import { Inject } from "@ipare/inject";
import inquirer from "inquirer";
import path from "path";
import { DepsService } from "../deps.service";
import * as fs from "fs";
import { allPlugins, Plugin } from "../../utils/plugins";

export class PluginSelectService {
  @Inject
  private readonly depsService!: DepsService;

  private get sourceDir() {
    return path.join(__dirname, "../../../template");
  }

  public async select(): Promise<Plugin[]> {
    const { plugins } = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: allPlugins.map<inquirer.DistinctChoice>((p) => ({
          value: p.value,
          name: p.name,
          checked: p.default,
        })),
      },
    ]);
    return plugins;
  }

  public async fixPlugins(
    plugins: Plugin[],
    ...paths: string[]
  ): Promise<Plugin[]> {
    const result: Plugin[] = [...plugins];
    const pkg = JSON.parse(
      await fs.promises.readFile(
        path.join(this.sourceDir, "package.json"),
        "utf-8"
      )
    );
    const { dependencies, devDependencies } = pkg;

    function add(plugin: Plugin) {
      if (!result.includes(plugin)) {
        result.push(plugin);
      }
    }

    function addFromDeps(deps: any, plugin: Plugin) {
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
          .map((item) => item.key.replace(/^@ipare\//, "") as Plugin)
          .forEach((dep) => {
            add(dep);
          });
      }
    });
    return result;
  }
}
