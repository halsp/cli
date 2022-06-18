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
      .description("Run sfa application.")
      .setBuildOptions("development")
      .option(
        "-b, --binary-to-run [program]",
        "Binary to run application (e.g., node, ts-node).",
        "node"
      )
      .option("-p, --port [port]", "The port on http listens", "2333")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup(undefined, command)
          .add(StartMiddleware)
          .add(BuildMiddlware)
          .run();
      });
  }
}
