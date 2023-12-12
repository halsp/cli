import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PluginService } from "../../services/plugin.service";
import chalk from "chalk";

export class ListPluginMiddleware extends Middleware {
  @Inject
  private readonly pluginService!: PluginService;

  async invoke() {
    const plugins = await this.pluginService.get();
    if (!plugins.length) {
      this.logger.info("No plugins.");
      return;
    }

    this.logger.info("Plugins:");
    plugins.forEach((item, index) => {
      const pkg = chalk.blueBright(item.package);
      this.logger.info(`  ${index + 1}. ${pkg}`);
    });

    await this.next();
  }
}
