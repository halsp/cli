import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateEnvService } from "../../services/create.services/create-env.service";
import { PackageManagerService } from "../../services/package-manager.service";

export class InstallMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly packageManagerService!: PackageManagerService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipInstall")) {
      return await this.next();
    }

    const pm = await this.packageManagerService.get();
    const installResult = this.packageManagerService.install(
      pm,
      this.createEnvService.targetDir
    );
    if (!installResult) {
      return;
    }

    await this.next();
  }
}
