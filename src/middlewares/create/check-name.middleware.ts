import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { CommandService } from "../../services/command.service";
import { CreateEnvService } from "../../services/create.services/create-env.service";
import * as fs from "fs";
import { FileService } from "../../services/file.service";
import { InquirerService } from "../../services/inquirer.service";

export class CheckNameMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly createEnvService!: CreateEnvService;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly inquirerService!: InquirerService;

  private get targetDir() {
    return this.createEnvService.targetDir;
  }

  async invoke() {
    if (!this.ctx.commandArgs.name) {
      await this.inputName();
    }

    if (!fs.existsSync(this.targetDir)) {
      return await this.next();
    }

    const force = this.commandService.getOptionVlaue<boolean>("force");
    if (force) {
      await fs.promises.rm(this.targetDir, {
        force: true,
        recursive: true,
      });
    } else {
      const y = this.commandService.getOptionVlaue<boolean>("y");
      if (!y) {
        const message = `Target directory ${this.targetDir} already exists. Overwrite?`;
        if (!(await this.fileService.isOverwrite(message))) {
          return;
        }
      }
    }

    await this.next();
  }

  private async inputName(): Promise<void> {
    const { name } = await this.inquirerService.prompt([
      {
        type: "input",
        message: "Project name:",
        name: "name",
        default: "halsp-project",
        validate: (input) => {
          const result = /^[^?v\*|""<>:/]{1,256}$/.test(input.trim());
          if (result) {
            return true;
          } else {
            return "Illegal name, please try again.";
          }
        },
      },
    ]);
    this.ctx.commandArgs.name = name.trim();
  }
}
