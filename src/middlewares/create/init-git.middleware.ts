import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateService } from "../../services/create.service";
import { RunnerService } from "../../services/runner.service";

export class InitGitMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createService!: CreateService;
  @Inject
  private readonly runnerService!: RunnerService;

  async invoke() {
    if (this.commandService.getOptionVlaue<boolean>("skipGit")) {
      return await this.next();
    }

    this.runnerService.run("git", "init", {
      cwd: this.createService.targetDir,
    });

    await this.next();
  }
}
