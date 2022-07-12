import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CreateMiddleware } from "../middlewares/create-middleware";
import { BaseCommand } from "./base.command";
import "./base-create";

export class InitCommand extends BaseCommand {
  register(command: Command): void {
    command
      .argument("[name]", "Application name")
      .description("Generate ipare application")
      .setCreateOptions()
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup({ name }, command).add(CreateMiddleware).run();
        }
      );
  }
}
