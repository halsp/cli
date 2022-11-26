import { Inject } from "@ipare/inject";
import path from "path";
import { DepsService } from "../deps.service";
import * as fs from "fs";

export class SortPluginsService {
  @Inject
  private readonly depsService!: DepsService;

  private get templateDir() {
    return path.join(__dirname, "../../../template");
  }

  private templatePackage?: any;

  public async sortPlugins(
    plugins: string[],
    onlyTemplateExist: boolean
  ): Promise<string[]> {
    const result: string[] = [...plugins];
    if (!this.templatePackage) {
      this.templatePackage = JSON.parse(
        await fs.promises.readFile(
          path.join(this.templateDir, "package.json"),
          "utf-8"
        )
      );
    }
    const { dependencies, devDependencies } = this.templatePackage;

    function add(plugin: string) {
      if (!result.includes(plugin)) {
        result.push(plugin);
      }
    }

    function addFromDeps(deps: any, plugin: string) {
      if (onlyTemplateExist) {
        if (Object.keys(deps).some((dep) => dep == `@ipare/${plugin}`)) {
          add(plugin);
        }
      } else {
        add(plugin);
      }
    }

    plugins.forEach((plugin) => {
      addFromDeps(dependencies, plugin);
      addFromDeps(devDependencies, plugin);

      if (Object.keys(dependencies).some((dep) => dep == `@ipare/${plugin}`)) {
        this.depsService
          .getPackageIpareDeps(`@ipare/${plugin}`, [this.templateDir])
          .map((item) => item.key.replace(/^@ipare\//, ""))
          .forEach((dep) => {
            add(dep);
          });
      }
    });
    return result;
  }
}
