import path from "path";
import * as fs from "fs";
import { isString } from "@ipare/core";
import { ExpressionService } from "./expression.service";
import { Inject } from "@ipare/inject";
import { SortPluginsService } from "./sort-plugins.service";

export type ExpressionObject<T = string | boolean> = Record<
  string,
  T | undefined
>;

type InternalPluginConfig<T = string | boolean> = {
  plugins: {
    name: string;
    desc: string;
    default?: boolean;
    when?: string | boolean;
  }[];
  dependencies: ExpressionObject<T>;
  files: ExpressionObject<T>;
  devDependencies: ExpressionObject<T>;
};
export type PluginConfig = InternalPluginConfig;
export type SortedPluginConfig = InternalPluginConfig<boolean>;

export class PluginConfigService {
  @Inject
  private readonly expressionService!: ExpressionService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;

  private get filePath() {
    return path.join(__dirname, "../../../template/plugin.json");
  }

  #config?: PluginConfig;
  public async getConfig(): Promise<PluginConfig> {
    if (!this.#config) {
      const content = await fs.promises.readFile(this.filePath, "utf-8");
      this.#config = JSON.parse(content);
    }
    return this.#config as PluginConfig;
  }

  public async getSortedConfig(plugins: string[]) {
    let config = await this.getConfig();
    config = JSON.parse(JSON.stringify(config));

    plugins = await this.sortPluginsService.sortPlugins(plugins, false);

    const calcExpression = (obj: ExpressionObject) => {
      for (const key in obj) {
        const value = obj[key];
        if (isString(value)) {
          obj[key] = this.expressionService.calcPlugins(value, plugins);
        }
      }
    };

    calcExpression(config.dependencies);
    calcExpression(config.files);
    calcExpression(config.devDependencies);
    for (const plugin of config.plugins) {
      if (isString(plugin.when)) {
        plugin.when = this.expressionService.calcPlugins(plugin.when, plugins);
      }
    }

    return config as SortedPluginConfig;
  }
}
