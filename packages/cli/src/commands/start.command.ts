import { Command } from "commander";
import { BaseCommand } from "./base.command";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { CliStartup } from "../cli-startup";
import { StartMiddleware } from "../middlewares/start.middleware";
import "./base-build";

export class StartCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("start")
      .alias("s")
      .setBuildOptions()
      .option("-p, --port [port]", "The port on http listens", "2333")
      .description("Run sfa application.")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup(undefined, command)
          .add(StartMiddleware)
          .add(BuildMiddlware)
          .run();
      });
  }
}
