import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import path, { dirname } from "path";
import chalk from "chalk";
import { PluginService } from "../../services/plugin.service";

export class RemovePluginMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly pluginService!: PluginService;

  async invoke() {
    const name = this.ctx.commandArgs.name;
    const plugins = this.pluginService.get();
    const plugin = plugins.filter((p) => p.package == name)[0];
    if (!plugin) {
      this.logger.error(`The plugin does not exist.`);
      return;
    }

    let dir = "";
    if (plugin.cwd) {
      dir = process.cwd();
    } else {
      dir = path.join(dirname(import.meta.url), "../../../");
    }

    const installResult = await this.packageManagerService.uninstall(name, dir);
    if (installResult.status != 0) {
      return;
    }

    this.logger.info(
      "Remove plugin " + chalk.bold.greenBright(name) + " success.",
    );
  }
}
