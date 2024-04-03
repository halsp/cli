import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BaseCommand } from "./base.command";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";
import { CleanDistMiddleware } from "../middlewares/build/clean-dist.middleware";

export class CleanCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("clean")
      .description("Clean Halsp application")
      .argument("[app]", "Where is the app")
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("clean", { app }, command)
            .add(ChdirMiddleware)
            .add(CleanDistMiddleware)
            .run();
        },
      );
  }
}
