import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateEnvService } from "../../services/create.services/create-env.service";
import { RunnerService } from "../../services/runner.service";

export class InitGitMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly runnerService!: RunnerService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipGit")) {
      return await this.next();
    }

    this.runnerService.run("git", "init", {
      cwd: this.createEnvService.targetDir,
    });

    await this.next();
  }
}
