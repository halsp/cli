import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { BaseCommand } from "./base.command";
import "./base-build";
import { CopyBuildResultMiddleware } from "../middlewares/copy-build-result.middleware";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .description("Build Halsp application")
      .setBuildOptions("production")
      .option("-sm, --sourceMap", "Whether to generate source map files.")
      .option("-cp, --copyPackage", "Copy package.json to out dir.")
      .option(
        "--removeDevDeps",
        "Remove devDependencies in package.json file when --copyPackage is true."
      )
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("build", { app }, command)
            .add(ChdirMiddleware)
            .add(BuildMiddlware)
            .add(CopyBuildResultMiddleware)
            .run();
        }
      );
  }
}
