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
    const name = this.ctx.commandArgs.name;
    const attachs = await this.attachService.get();
    const attach = attachs.filter((p) => p.package == name)[0];
    if (!attach) {
      this.logger.error(`The attach does not exist.`);
      return;
    }

    let dir = "";
    if (attach.cwd) {
      dir = process.cwd();
    } else {
      dir = path.join(__dirname, "../../../");
    }
    const packagePath = path.join(dir, "package.json");

    const registry = this.commandService.getOptionVlaue<string>("registry");
    const pkgData = await fs.promises.readFile(packagePath, "utf-8");
    const packageManager = await this.packageManagerService.get();

    await chalkInit();
    await runLocal(
      {
        upgrade: true,
        filter: name,
        cwd: dir,
        loglevel: "warn",
        registry: registry,
        packageManager: packageManager as any,
      },
      pkgData,
      packagePath,
    );
  }
}
