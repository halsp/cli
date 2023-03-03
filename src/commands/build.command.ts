import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { BaseCommand } from "./base.command";
import "./base-build";
import { CopyBuildResultMiddleware } from "../middlewares/copy-build-result.middleware";

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .description("Build halsp application")
      .setBuildOptions("production")
      .option("-sm, --sourceMap", "Whether to generate source map files.")
      .option("-cp, --copyPackage", "Copy package.json to out dir.")
      .option(
        "--removeDevDeps",
        "Remove devDependencies in package.json file when --copyPackage is true."
      )
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup("build", undefined, command)
          .add(BuildMiddlware)
          .add(CopyBuildResultMiddleware)
          .run();
      });
  }
}
