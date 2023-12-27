import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import fs from "fs";
import { AttachService } from "../../services/attach.service";
import { CommandService } from "../../services/command.service";
import { chalkInit } from "npm-check-updates/build/src/lib/chalk.js";
import runLocal from "npm-check-updates/build/src/lib/runLocal.js";
import path from "path";

export class UpdateAttachMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly attachService!: AttachService;

  async invoke() {
    const names = this.attachService.names;
    const packagePath = path.join(this.attachService.cacheDir, "package.json");
    const pkgData = await fs.promises.readFile(packagePath, "utf-8");
    const packageManager = await this.packageManagerService.get();

    const registry = this.commandService.getOptionVlaue<string>("registry");
    await chalkInit();
    await runLocal(
      {
        upgrade: true,
        filter: names,
        cwd: this.attachService.cacheDir,
        loglevel: "warn",
        registry: registry,
        packageManager: packageManager as any,
      },
      pkgData,
      packagePath,
    );
  }
}
