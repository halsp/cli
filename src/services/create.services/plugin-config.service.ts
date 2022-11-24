import path from "path";
import * as fs from "fs";
import { isString } from "@ipare/core";
import { ExpressionService } from "./expression.service";
import { Inject } from "@ipare/inject";

type ExpressionObject = Record<string, string | boolean | undefined>;
type SortedExpressionObject = Record<string, boolean | undefined>;

type InternalPluginConfig<T> = {
  plugins: { name: string; desc: string; default?: boolean }[];
  dependencies: T;
  files: T;
  devDependencies: T;
};
export type PluginConfig = InternalPluginConfig<ExpressionObject>;
export type SortedPluginConfig = InternalPluginConfig<SortedExpressionObject>;

export class PluginConfigService {
  @Inject
  private readonly expressionService!: ExpressionService;

  #config?: PluginConfig;
  public async getConfig(): Promise<PluginConfig> {
    if (!this.#config) {
      const file = path.join(__dirname, "../../../template/plugin.json");
      const content = await fs.promises.readFile(file, "utf-8");
      this.#config = JSON.parse(content);
    }
    return this.#config as PluginConfig;
  }

  public async getSortedConfig(plugins: string[]) {
    let config = await this.getConfig();
    config = JSON.parse(JSON.stringify(config));

    const calcExpression = (obj: ExpressionObject) => {
      for (const key in obj) {
        const value = obj[key];
        if (isString(value)) {
          const newValue = this.expressionService.calcPlugins(value, plugins);
          obj[key] = newValue;
        }
      }
    };

    calcExpression(config.dependencies);
    calcExpression(config.files);
    calcExpression(config.devDependencies);

    return config as SortedPluginConfig;
  }
}
