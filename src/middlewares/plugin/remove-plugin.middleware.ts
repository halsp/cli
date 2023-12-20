import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import path from "path";
import { PluginService } from "../../services/plugin.service";
import { ChalkService } from "../../services/chalk.service";

export class RemovePluginMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly pluginService!: PluginService;
  @Inject
  private readonly chalkService!: ChalkService;

  async invoke() {
    const name = this.ctx.commandArgs.name;
    const plugins = await this.pluginService.get();
    const plugin = plugins.filter((p) => p.package == name)[0];
    if (!plugin) {
      this.logger.error(`The plugin does not exist.`);
      return;
    }

    let dir = "";
    if (plugin.cwd) {
      dir = process.cwd();
    } else {
      dir = path.join(__dirname, "../../../");
    }

    const installResult = await this.packageManagerService.uninstall(name, dir);
    if (installResult.status != 0) {
      return;
    }

    this.logger.info(
      "Remove plugin " + this.chalkService.bold.greenBright(name) + " success.",
    );
  }
}
