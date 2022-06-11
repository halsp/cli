import { Inject } from "@sfajs/inject";
import inquirer from "inquirer";
import path from "path";
import { DepsService } from "./deps.service";
import * as fs from "fs";
import { allPlugins, Plugin } from "../utils/plugins";

export class PluginSelectService {
  @Inject
  private readonly depsService!: DepsService;

  private get sourceDir() {
    return path.join(__dirname, "../../template");
  }

  public async select(): Promise<Plugin[]> {
    const { plugins } = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: allPlugins.filter((p) => ({
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

    plugins.forEach((plugin) => {
      if (Object.keys(dependencies).some((dep) => dep == `@sfajs/${plugin}`)) {
        this.depsService
          .getPackageSfaDeps(`@sfajs/${plugin}`, paths)
          .map((item) => item.key.replace(/^@sfajs\//, "") as Plugin)
          .forEach((dep) => {
            if (!result.includes(dep)) {
              result.push(dep);
            }
          });
      }

      if (
        Object.keys(devDependencies).some((dep) => dep == `@sfajs/${plugin}`)
      ) {
        if (!result.includes(plugin)) {
          result.push(plugin);
        }
      }
    });
    return result;
  }
}
