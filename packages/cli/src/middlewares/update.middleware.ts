import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "../configuration";
import { Inject } from "@ipare/inject";
import { PackageManagerService } from "../services/package-manager.service";
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
  private readonly commandService!: CommandService;

  override async invoke(): Promise<void> {
    const runResult = await this.runNcu();

    if (!this.skipUpgrade && runResult && Object.keys(runResult).length > 0) {
      const packageManager = await this.getPackageManager();
      this.packageManagerService.install(packageManager);
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
      this.parsePackageManager();
    if (!result) {
      result = await this.packageManagerService.pickPackageManager();
    }
    return result;
  }

  private parsePackageManager(): "pnpm" | "yarn" | "npm" {
    if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) {
      return "pnpm";
    } else if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) {
      return "yarn";
    } else {
      return "npm";
    }
  }
}
