import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { BaseCommand } from "./base.command";
import "./base-build";
import { CopyResultMiddleware } from "../middlewares/copy-result.middleware";

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .description("Build sfa application.")
      .setBuildOptions("production")
      .option("-sm, --sourceMap", "Whether to generate source map files.")
      .option(
        "-b, --binary-to-run [program]",
        "Binary to run application (e.g., node, ts-node).",
        "node"
      )
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup(undefined, command)
          .add(BuildMiddlware)
          .add(CopyResultMiddleware)
          .run();
      });
  }
}
