import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { UpdateMiddleware } from "../middlewares/update.middleware";
import { BaseCommand } from "./base.command";

export class UpdateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("update")
      .alias("u")
      .description("Update sfa dependencies.")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup({}, command).add(UpdateMiddleware).run();
      });
  }
}
