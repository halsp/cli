import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { BaseCommand } from "./base.command";
import "./base-build";
import { CopyBuildResultMiddleware } from "../middlewares/copy-build-result.middleware";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";
import { EnvMiddleware } from "../middlewares/env.middleware";

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .description("Build Halsp application")
      .setBuildOptions("production")
      .option("-sm, --sourceMap", "Whether to generate source map files.")
      .option("--removeDevDeps", "Remove devDependencies in package.json file")
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("build", { app }, command)
            .add(ChdirMiddleware)
            .add(EnvMiddleware)
            .add(BuildMiddlware)
            .add(CopyBuildResultMiddleware)
            .run();
        },
      );
  }
}
