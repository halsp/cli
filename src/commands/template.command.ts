import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CheckNameMiddleware } from "../middlewares/create/check-name.middleware";
import { InitGitMiddleware } from "../middlewares/create/init-git.middleware";
import { InstallMiddleware } from "../middlewares/create/install.middleware";
import { RunMiddleware } from "../middlewares/create/run.middleware";
import { TemplateMiddleware } from "../middlewares/create/template.middleware";
import { BaseCommand } from "./base.command";

export class TemplateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("template")
      .alias("t")
      .description("Generate a project from a remote template")
      .argument("<template>", "Template name")
      .argument("[name]", "Aapplication name")
      .option(
        "-f, --force",
        "Force create application, delete existing files. ",
        false
      )
      .option("-y, --y", "Override existing files. ", false)
      .option(
        "-pm, --packageManager <packageManager>",
        "Specify package manager. (npm/yarn/pnpm/cnpm)"
      )
      .option("--registry <url>", "Override configuration registry")
      .option("--debug", "Debug mode")
      .option("-si, --skipInstall", "Skip install project")
      .option("-sg, --skipGit", "Skip git repository initialization")
      .option("-sr, --skipRun", "Skip running after completion")
      .setCommonOptions()
      .action(
        async (
          template: string,
          name: string,
          command: Record<string, boolean | string>
        ) => {
          await new CliStartup("template", { template, name }, command)
            .add(CheckNameMiddleware)
            .add(TemplateMiddleware)
            .add(InitGitMiddleware)
            .add(InstallMiddleware)
            .add(RunMiddleware)
            .run();
        }
      );
  }
}
