import { BaseCommand } from "./base.command";
import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { InfoMiddleware } from "../middlewares/info.middleware";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";

export class InfoCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("info")
      .alias("i")
      .description("Display halsp project details")
      .argument("[app]", "Where is the app")
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("info", { app }, command)
            .add(ChdirMiddleware)
            .add(InfoMiddleware)
            .run();
        }
      );
  }
}
