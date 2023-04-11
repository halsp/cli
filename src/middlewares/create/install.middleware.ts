import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateService } from "../../services/create.service";
import { PackageManagerService } from "../../services/package-manager.service";

export class InstallMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipInstall")) {
      return await this.next();
    }

    const pm = await this.packageManagerService.get();
    const installResult = this.packageManagerService.install(
      pm,
      this.createService.targetDir
    );
    if (installResult.status != 0) {
      return;
    }

    await this.next();
  }
}
