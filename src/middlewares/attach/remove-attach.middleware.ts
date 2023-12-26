import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { PackageManagerService } from "../../services/package-manager.service";
import { AttachService } from "../../services/attach.service";
import { ChalkService } from "../../services/chalk.service";

export class RemoveAttachMiddleware extends Middleware {
  @Inject
  private readonly packageManagerService!: PackageManagerService;
  @Inject
  private readonly attachService!: AttachService;
  @Inject
  private readonly chalkService!: ChalkService;

  async invoke() {
    const name = this.ctx.commandArgs.name;
    const attachs = await this.attachService.get();
    const attach = attachs.filter((p) => p.package == name)[0];
    if (!attach) {
      this.logger.error(`The attach does not exist.`);
      return;
    }

    const installResult = await this.packageManagerService.uninstall(
      name,
      this.attachService.cacheDir,
    );
    if (installResult.status != 0) {
      return;
    }

    this.logger.info(
      "Remove attach " + this.chalkService.bold.greenBright(name) + " success.",
    );
  }
}
