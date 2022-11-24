import { Context } from "@ipare/core";
import { Inject } from "@ipare/inject";
import { InjectContext } from "@ipare/pipe";
import path from "path";
import { CreateEnvService } from "./create-env.service";
import * as fs from "fs";
import { PackageManagerService } from "../package-manager.service";
import prettier from "prettier";
import { CommandService } from "../command.service";
import {
  PluginConfigService,
  SortedPluginConfig,
} from "./plugin-config.service";

export class CreatePackageService {
  @InjectContext
  private readonly ctx!: Context;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly pluginConfigService!: PluginConfigService;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  public async create(plugins: string[]): Promise<boolean> {
    const pkg = this.getPackage();
    const pluginConfig = await this.pluginConfigService.getSortedConfig(
      plugins
    );

    this.setDeps(pkg.dependencies, plugins, pluginConfig, false);
    this.setDeps(pkg.devDependencies, plugins, pluginConfig, true);

    this.setCliVersion(pkg);
    pkg.name = this.name;
    pkg.version = this.getCurrentVersion().replace(/^\^/, "");

    const filePath = path.join(this.targetDir, "package.json");
    await fs.promises.writeFile(
      filePath,
      prettier.format(JSON.stringify(pkg), {
        parser: "json",
      })
    );

    const pm = await this.getPackageManager();
    const installResult = this.packageManagerService.install(
      pm,
      this.targetDir
    );
    return installResult.status == 0;
  }

  private async getPackageManager() {
    let pm = this.commandService.getOptionVlaue<string>("packageManager");
    if (!pm) {
      pm = await this.packageManagerService.pickPackageManager();
    }
    return pm;
  }

  private setDeps(
    deps: Record<string, string>,
    plugins: string[],
    pluginConfig: SortedPluginConfig,
    isDev: boolean
  ) {
    if (!deps) return;

    const { dependencies, devDependencies } = pluginConfig;

    Object.keys(deps)
      .filter((k) => k.startsWith("@ipare/"))
      .filter((k) => !plugins.some((p) => `@ipare/${p}` == k))
      .forEach((key) => {
        delete deps[key];
      });

    Object.keys(deps)
      .filter((k) => dependencies[k] == false)
      .filter((k) => !isDev || devDependencies[k] != true)
      .forEach((key) => {
        delete deps[key];
      });
  }

  private getPackage(): any {
    const file = path.join(__dirname, "../../../template/package.json");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(file);
  }

  private setCliVersion(pkg: Record<string, any>) {
    const version = this.getCurrentVersion();
    if (
      pkg.dependencies &&
      Object.keys(pkg.dependencies).includes("@ipare/cli")
    ) {
      pkg.dependencies["@ipare/cli"] = version;
    }
    if (
      pkg.devDependencies &&
      Object.keys(pkg.devDependencies).includes("@ipare/cli")
    ) {
      pkg.devDependencies["@ipare/cli"] = version;
    }
  }

  private getCurrentVersion() {
    let version = this.commandService.getOptionVlaue<string>("cliVersion", "");
    if (version == "cli-test" || version == "test-cli") {
      version = path.join(__dirname, "../../..");
    }
    return version;
  }
}
