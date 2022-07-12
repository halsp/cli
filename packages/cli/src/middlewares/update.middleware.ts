import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../configuration";
import { Inject } from "@ipare/inject";
import { PackageManagerService } from "../services/package-manager.service";
import { ConfigService } from "../services/config.service";
import { CommandService } from "../services/command.service";
import * as fs from "fs";
import path from "path";
import runLocal from "npm-check-updates/build/src/lib/runLocal";

export class UpdateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "update";
  }

  private get packagePath() {
    return path.join(process.cwd(), "package.json");
  }
  private get skipUpgrade() {
    return this.commandService.getOptionVlaue<boolean>("skipUpgrade", false);
  }

  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly configService!: ConfigService;
  @Inject
  private readonly commandService!: CommandService;

  override async invoke(): Promise<void> {
    const runResult = await this.runNcu();

    if (!this.skipUpgrade && runResult && Object.keys(runResult).length > 0) {
      const packageManager = await this.getPackageManager();
      this.packageManagerService.install(packageManager, process.cwd());
    }
  }

  private async runNcu() {
    const tag = this.commandService.getOptionVlaue<string>("tag");
    const pkgData = await fs.promises.readFile(this.packagePath, "utf-8");

    return await runLocal(
      {
        upgrade: true,
        target: tag as any,
        filter: this.getFilter(),
        cwd: process.cwd(),
        loglevel: "warn",
      },
      pkgData,
      this.skipUpgrade ? undefined : this.packagePath
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

    return /^\@ipare\//;
  }

  private async getPackageManager() {
    let result =
      this.commandService.getOptionVlaue<string>("packageManager") ??
      this.configService.value.packageManager;
    if (!result) {
      result = await this.packageManagerService.pickPackageManager();
    }
    return result;
  }
}
