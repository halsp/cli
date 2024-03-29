import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../services/package-manager.service";
import { CommandService } from "../services/command.service";
import * as fs from "fs";
import path from "path";
import runLocal from "npm-check-updates/build/src/lib/runLocal.js";
import { chalkInit } from "npm-check-updates/build/src/lib/chalk.js";
import { Middleware } from "@halsp/core";

export class UpdateMiddleware extends Middleware {
  private get packagePath() {
    return path.join(process.cwd(), "package.json");
  }
  private get skipUpgrade() {
    return this.commandService.getOptionVlaue<boolean>("skipUpgrade", false);
  }
  private get skipInstall() {
    return this.commandService.getOptionVlaue<boolean>("skipInstall", false);
  }
  private get registry() {
    return this.commandService.getOptionVlaue<string>("registry");
  }

  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly commandService!: CommandService;

  override async invoke(): Promise<void> {
    const runResult = await this.runNcu();

    if (
      !this.skipUpgrade &&
      !this.skipInstall &&
      runResult &&
      Object.keys(runResult).length > 0
    ) {
      await this.packageManagerService.install();
    }
  }

  private async runNcu() {
    const tag = this.commandService.getOptionVlaue<string>("tag");
    const pkgData = await fs.promises.readFile(this.packagePath, "utf-8");
    const packageManager = await this.packageManagerService.get();

    await chalkInit();
    return await runLocal(
      {
        upgrade: true,
        target: tag as any,
        filter: this.getFilter(),
        cwd: process.cwd(),
        loglevel: "warn",
        registry: this.registry,
        packageManager: packageManager as any,
      },
      pkgData,
      this.skipUpgrade ? undefined : this.packagePath,
    );
  }

  private getFilter() {
    const pkgName = this.commandService.getOptionVlaue<string>("name");
    if (pkgName) {
      return pkgName;
    }

    const updateAll = this.commandService.getOptionVlaue<boolean>("all", false);
    if (updateAll) {
      return undefined;
    }

    return /^\@halsp\//;
  }
}
