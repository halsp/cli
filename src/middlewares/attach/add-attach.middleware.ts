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
    const names = this.attachService.names;
    if (!(await this.installAttachs(names))) return;

    this.logger.info(
      "Attach " +
        this.chalkService.bold.greenBright(names.join(" ")) +
        " success.",
    );
  }

  private async installAttachs(names: string[]) {
    const installResult = await this.packageManagerService.add(
      names,
      undefined,
      this.attachService.cacheDir,
    );
    return installResult.status == 0;
  }
}
