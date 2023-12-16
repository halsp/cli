import { Inject } from "@halsp/inject";
import { InquirerService } from "../inquirer.service";
import { PluginConfig, PluginConfigService } from "./plugin-config.service";

export class PluginSelectService {
  @Inject
  private readonly pluginConfigService!: PluginConfigService;
  @Inject
  private readonly inquirerService!: InquirerService;

  public async select(env?: string): Promise<string[]> {
    let pluginConfig: PluginConfig;
    if (env) {
      pluginConfig = await this.pluginConfigService.getSortedConfig([env]);
    } else {
      pluginConfig = await this.pluginConfigService.getConfig();
    }

    const { plugins } = await this.inquirerService.prompt([
      {
        type: "checkbox",
        message: "Select plugins",
        name: "plugins",
        choices: pluginConfig.plugins
          .filter((p) => p.when != false)
          .map<any>((p) => ({
            value: p.name,
            name: p.desc,
            checked: p.default,
          })),
      },
    ]);

    return plugins;
  }
}
