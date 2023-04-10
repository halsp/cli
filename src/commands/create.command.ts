import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CreateMiddleware } from "../middlewares/create-middleware";
import { BaseCommand } from "./base.command";
import "./base-create";

export class CreateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("create")
      .alias("c")
      .description("Generate Halsp application")
      .argument("[name]", "Aapplication name")
      .setCreateOptions()
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup("create", { name }, command)
            .add(CreateMiddleware)
            .run();
        }
      );
  }
}
