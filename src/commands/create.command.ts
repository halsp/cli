import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { ScaffoldMiddleware } from "../middlewares/create/scaffold.middleware";
import { BaseCommand } from "./base.command";
import { RunMiddleware } from "../middlewares/create/run.middleware";
import { InstallMiddleware } from "../middlewares/create/install.middleware";
import { InitGitMiddleware } from "../middlewares/create/init-git.middleware";
import { CheckNameMiddleware } from "../middlewares/create/check-name.middleware";

export class CreateCommand extends BaseCommand {
  constructor(private readonly withCommand: boolean) {
    super();
  }

  register(command: Command): void {
    if (this.withCommand) {
      command.command("create").alias("c");
    }
    command
      .description("Generate Halsp application")
      .argument("[name]", "Aapplication name")
      .option(
        "-f, --force",
        "Force create application, delete existing files. ",
        false
      )
      .option("-y, --y", "Override existing files. ", false)
      .option(
        "-e, --env <env>",
        "The environment to run application. (lambda/native/azure/micro-tcp/...)"
      )
      .option(
        "-pm, --packageManager <packageManager>",
        "Specify package manager. (npm/yarn/pnpm/cnpm)"
      )
      .option("--registry <url>", "Override configuration registry")
      .option("--debug", "Debug mode")
      .option(
        "-ps, --plugins <plugins>",
        "Plugins to add (e.g. view,router,inject)"
      )
      .option("-si, --skipInstall", "Skip install project")
      .option("-se, --skipEnv", "Skip adding environment files")
      .option("-sg, --skipGit", "Skip git repository initialization")
      .option("-sp, --skipPlugins", "No plugins will be added")
      .option("-sr, --skipRun", "Skip running after completion")
      .option("--forceInit", "Force init scaffold")
      .setCommonOptions()
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup("create", { name }, command)
            .add(CheckNameMiddleware)
            .add(ScaffoldMiddleware)
            .add(InitGitMiddleware)
            .add(InstallMiddleware)
            .add(RunMiddleware)
            .run();
        }
      );
  }
}
