import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CreateMiddleware } from "../middlewares/create-middleware";
import { BaseCommand } from "./base.command";

export class CreateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("create <name>")
      .alias("c")
      .description("Generate sfa application")
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup({ name }, command).add(CreateMiddleware).run();
        }
      );
  }
}