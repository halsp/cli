import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CreateMiddleware } from "../middlewares/create-middleware";
import { BaseCommand } from "./base.command";
import "./base-create";

export class CreateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("create <name>")
      .alias("c")
      .description("Generate sfa application")
      .setCreateOptions()
      .option(
        "-ps, --plugins [plugins]",
        "Plugins to add (e.g. view,router,inject)"
      )
      .option("-ps, --skip-plugins", "No plugins will be added")
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup({ name }, command).add(CreateMiddleware).run();
        }
      );
  }
}
