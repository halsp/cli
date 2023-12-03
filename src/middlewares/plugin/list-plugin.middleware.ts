import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { ChalkService } from "../../services/chalk.service";
import { PluginService } from "../../services/plugin.service";

export class ListPluginMiddleware extends Middleware {
  @Inject
  private readonly chalkService!: ChalkService;
  @Inject
  private readonly pluginService!: PluginService;

  async invoke() {
    const plugins = this.pluginService.get();
    if (!plugins.length) {
      this.logger.info("No plugins.");
      return;
    }

    this.logger.info("Plugins:");
    plugins.forEach((item, index) => {
      const pkg = this.chalkService.blueBright(item.package);
      this.logger.info(`  ${index + 1}. ${pkg}`);
    });

    await this.next();
  }
}
