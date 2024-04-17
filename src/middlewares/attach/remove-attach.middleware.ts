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
    const names = this.attachService.names;
    const installResult = await this.packageManagerService.uninstall(
      names,
      this.attachService.cacheDir,
    );
    if (installResult.status != 0) {
      return;
    }

    this.logger.info("Remove success:");
    names.forEach((name, index) => {
      const cName = this.chalkService.greenBright(name);
      this.logger.info(`  ${index + 1}. ${cName}`);
    });
  }
}
