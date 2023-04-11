import * as fs from "fs";
import { CreateScaffoldService } from "../../services/create.services/create-scaffold.service";
import { Inject } from "@halsp/inject";
import { CreateEnvService } from "../../services/create.services/create-env.service";
import { PluginSelectService } from "../../services/create.services/plugin-select.service";
import { CreatePackageService } from "../../services/create.services/create-package.service";
import { CommandService } from "../../services/command.service";
import { CopyBaseService } from "../../services/create.services/copy-base-files.service";
import { Middleware } from "@halsp/core";
import { SortPluginsService } from "../../services/create.services/sort-plugins.service";
import { ChalkService } from "../../services/chalk.service";
import { PackageManagerService } from "../../services/package-manager.service";

export class ScaffoldMiddleware extends Middleware {
  @Inject
  private readonly createScaffoldService!: CreateScaffoldService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly createPackageService!: CreatePackageService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly copyBaseService!: CopyBaseService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;
  @Inject
  private readonly chalkService!: ChalkService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  override async invoke(): Promise<void> {
    if (!fs.existsSync(this.targetDir)) {
      await fs.promises.mkdir(this.targetDir, {
        recursive: true,
      });
    }

    const pm = await this.packageManagerService.get();
    const ir = await this.createScaffoldService.init(pm);
    if (!ir) return;

    const env = await this.createEnvService.create();
    const plugins = await this.getPlugins(env);
    await this.logPlugins(plugins);

    await this.createPackageService.create(plugins);
    await this.copyBaseService.copy();
    await this.createScaffoldService.create(plugins);

    await this.next();
  }

  private async getPlugins(env?: string) {
    let plugins: string[];
    if (this.commandService.getOptionVlaue<boolean>("skipPlugins")) {
      plugins = [];
    } else {
      const argPlugins = this.commandService.getOptionVlaue<string>("plugins");
      if (argPlugins) {
        plugins = argPlugins
          .split(/\_|\,|\s/)
          .map((item) => item.trim())
          .filter((item) => !!item);
      } else {
        plugins = await this.pluginSelectService.select(env);
      }
    }
    if (!plugins.includes("core")) {
      plugins.push("core");
    }
    if (env) {
      plugins.push(env);
    }
    plugins = await this.sortPluginsService.sortPlugins(plugins, true);
    return plugins;
  }

  private async logPlugins(plugins: string[]) {
    const existPlugins = await this.sortPluginsService.filterExistPlugins(
      plugins
    );
    const consolePlugins = existPlugins
      .filter((p) => p != "common")
      .map((p) => `@halsp/${p}`);
    this.logger.info("\n");
    this.logger.info(
      this.chalkService.bold("Sorted plugins"),
      this.chalkService.greenBright(consolePlugins.join(", "))
    );
    this.logger.info("\n");
  }
}
