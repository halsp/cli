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
      .description("Run ipare application")
      .setBuildOptions("development")
      .option(
        "-b, --binaryToRun [program]",
        "Binary to run application (e.g., node, ts-node)"
      )
      .option("-p, --port [port]", "The port on http listens")
      .option("--inspect [hostport]", "Run in inspect mode")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup("start", undefined, command)
          .add(StartMiddleware)
          .add(BuildMiddlware)
          .run();
      });
  }
}
