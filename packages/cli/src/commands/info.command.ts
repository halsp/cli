import { BaseCommand } from "./base.command";
import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { InfoMiddleware } from "../middlewares/info.middleware";

export class InfoCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("info")
      .alias("i")
      .description("Display ipare project details")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup("info", undefined, command)
          .add(InfoMiddleware)
          .run();
      });
  }
}
