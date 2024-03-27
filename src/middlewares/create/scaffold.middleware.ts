import { CopyScaffoldService } from "../../services/scaffold.services/copy-scaffold.service";
import { Inject } from "@halsp/inject";
import { EnvService } from "../../services/scaffold.services/env.service";
import { PluginSelectService } from "../../services/scaffold.services/plugin-select.service";
import { CopyPackageService } from "../../services/scaffold.services/copy-package.service";
import { CommandService } from "../../services/command.service";
import { CopyRootService } from "../../services/scaffold.services/copy-root.service";
import { Middleware } from "@halsp/core";
import { SortPluginsService } from "../../services/scaffold.services/sort-plugins.service";
import { PackageManagerService } from "../../services/package-manager.service";
import { InitService } from "../../services/scaffold.services/init.service";
import { ChalkService } from "../../services/chalk.service";
import { CopyTsconfigService } from "../../services/scaffold.services/copy-tsconfig.service";

export class ScaffoldMiddleware extends Middleware {
  @Inject
  private readonly copyScaffoldService!: CopyScaffoldService;
  @Inject
  private readonly initService!: InitService;
  @Inject
  private readonly envService!: EnvService;
  @Inject
  private readonly copyPackageService!: CopyPackageService;
  @Inject
  private readonly pluginSelectService!: PluginSelectService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly copyRootService!: CopyRootService;
  @Inject
  private readonly sortPluginsService!: SortPluginsService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly chalkService!: ChalkService;
  @Inject
  private readonly copyTsconfigService!: CopyTsconfigService;

  override async invoke(): Promise<void> {
    const pm = await this.packageManagerService.get();
    const ir = await this.initService.init(pm);
    if (!ir) return;

    const env = await this.envService.getEnv();
    const plugins = await this.getPlugins(env?.plugin);
    await this.logPlugins(plugins);

    await this.copyPackageService.create(plugins);
    await this.copyTsconfigService.create();
    await this.copyRootService.copy();

    const exFlags = env?.flag ? [env.flag] : [];
    await this.copyScaffoldService.create(plugins, ...exFlags);

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
    const existPlugins =
      await this.sortPluginsService.filterExistPlugins(plugins);
    const consolePlugins = existPlugins
      .filter((p) => p != "common")
      .map((p) => `@halsp/${p}`);
    this.logger.info("\n");
    this.logger.info(
      this.chalkService.bold("Sorted plugins"),
      this.chalkService.greenBright(consolePlugins.join(", ")),
    );
    this.logger.info("\n");
  }
}
