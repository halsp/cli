import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateEnvService } from "../../services/create.services/create-env.service";
import { RunnerService } from "../../services/runner.service";

export class RunMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly runnerService!: RunnerService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipInstall")) {
      return await this.next();
    }
    if (this.commandService.getOptionVlaue<boolean>("skipRun")) {
      return await this.next();
    }

    this.runnerService.run("npm", "start", {
      cwd: this.createEnvService.targetDir,
    });

    await this.next();
  }
}
