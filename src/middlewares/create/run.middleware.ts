import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateService } from "../../services/create.service";
import { RunnerService } from "../../services/runner.service";

export class RunMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createService!: CreateService;
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
      cwd: this.createService.targetDir,
    });

    await this.next();
  }
}
