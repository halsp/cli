import { Command } from "commander";
import { BaseCommand } from "./base.command";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { CliStartup } from "../cli-startup";
import { StartMiddleware } from "../middlewares/start.middleware";
import "./base-build";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";

export class StartCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("start")
      .alias("s")
      .description("Run Halsp application")
      .setBuildOptions("development")
      .option("--startupFile <path>", "The file to startup")
      .option(
        "-b, --binaryToRun <program>",
        "Binary to run application (e.g., node, ts-node)"
      )
      .option("-p, --port <port>", "The port on http listens")
      .option("--inspect <hostport>", "Run in inspect mode")
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("start", { app }, command)
            .add(ChdirMiddleware)
            .add(StartMiddleware)
            .add(BuildMiddlware)
            .run();
        }
      );
  }
}
