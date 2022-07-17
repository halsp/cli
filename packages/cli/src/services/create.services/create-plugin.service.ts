import { Inject } from "@ipare/inject";
import * as fs from "fs";
import path from "path";
import { ExpressionService } from "./expression.service";
import glob from "glob";
import { Plugin } from "../../utils/plugins";

type PluginConfig = {
  dependencies: Record<string, string | boolean | undefined>;
  constant: Plugin[];
  files: Record<string, string | boolean | undefined>;
};
export type FixedPluginConfig = {
  dependencies: Record<string, boolean | undefined>;
  constant: Plugin[];
  files: Record<string, boolean | undefined>;
};

export class CreatePluginService {
  @Inject
  private readonly expressionService!: ExpressionService;

  private get sourceDir() {
    return path.join(__dirname, "../../../template");
  }

  public async getPluginConfig(plugins: Plugin[]) {
    const file = path.join(__dirname, "../../../template/plugin.json");
    const config: PluginConfig = JSON.parse(
      await fs.promises.readFile(file, "utf-8")
    );
    for (const key in config.dependencies) {
      const value = config.dependencies[key] as string;
      const newValue = this.expressionService.calcPlugins(value, plugins);
      config.dependencies[key] = newValue;
    }

    for (const key in config.files) {
      const value = config.files[key] as string;
      const newValue = this.expressionService.calcPlugins(value, plugins);
      config.files[key] = newValue;
    }

    return config as FixedPluginConfig;
  }

  public async excludePluginFiles(plugins: Plugin[]) {
    const { files } = await this.getPluginConfig(plugins);
    const result: string[] = [];
    for (const excludes in files) {
      if (files[excludes]) {
        continue;
      }

      const paths = glob.sync(excludes, {
        cwd: this.sourceDir,
        dot: true,
        nodir: true,
      });
      result.push(...paths);
    }
    return result;
  }
}
