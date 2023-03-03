import { Inject } from "@halsp/inject";
import inquirer from "inquirer";
import { PluginConfig, PluginConfigService } from "./plugin-config.service";

export class PluginSelectService {
  @Inject
  private readonly pluginConfigService!: PluginConfigService;

  public async select(env?: string): Promise<string[]> {
    let pluginConfig: PluginConfig;
    if (env) {
      pluginConfig = await this.pluginConfigService.getSortedConfig([env]);
    } else {
      pluginConfig = await this.pluginConfigService.getConfig();
    }

    const { plugins } = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: pluginConfig.plugins
          .filter((p) => p.when != false)
          .map<inquirer.DistinctChoice>((p) => ({
            value: p.name,
            name: p.desc,
            checked: p.default,
          })),
      },
    ]);

    return plugins;
  }
}
