import { Inject } from "@halsp/inject";
import { CommandService } from "../services/command.service";
import { Middleware } from "@halsp/core";
import dotenv from "dotenv";

export class EnvMiddleware extends Middleware {
  @Inject
  private readonly commandService!: CommandService;

  override async invoke() {
    const envStrs = this.commandService.getOptionVlaue<string[]>("env", []);
    const envs = dotenv.parse(envStrs.join("\n"));
    for (const k in envs) {
      process.env[k] = envs[k];
    }

    await this.next();
  }
}
