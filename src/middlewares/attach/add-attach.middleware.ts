import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import { AttachService } from "../../services/attach.service";
import { ChalkService } from "../../services/chalk.service";

export class AddAttachMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly attachService!: AttachService;
  @Inject
  private readonly chalkService!: ChalkService;

  async invoke() {
    const name = this.ctx.commandArgs.name;

    const attachs = await this.attachService.get();
    if (attachs.filter((p) => p.package == name).length) {
      this.logger.error(`This attach has already been added.`);
      return;
    }

    if (!(await this.installAttach(name))) return;
    if (!(await this.installBaseOn(name))) return;

    this.logger.info(
      "Add attach " + this.chalkService.bold.greenBright(name) + " success.",
    );
  }

  private async installAttach(name: string) {
    const installResult = await this.packageManagerService.add(
      name,
      undefined,
      this.attachService.cacheDir,
    );
    return installResult.status == 0;
  }

  private async installBaseOn(name: string) {
    const attachs = await this.attachService.get();
    const attach = attachs.filter((p) => p.package == name)[0];
    if (!attach) return false;

    const baseOn = Array.isArray(attach.config.baseOn)
      ? attach.config.baseOn
      : [attach.config.baseOn];
    for (const pkg in baseOn) {
      await this.installAttach(pkg);
    }
  }
}
