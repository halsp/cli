import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { ScaffoldMiddleware } from "../middlewares/create/scaffold.middleware";
import { BaseCommand } from "./base.command";
import { RunMiddleware } from "../middlewares/create/run.middleware";
import { InstallMiddleware } from "../middlewares/create/install.middleware";
import { InitGitMiddleware } from "../middlewares/create/init-git.middleware";
import { CheckNameMiddleware } from "../middlewares/create/check-name.middleware";
import { CommandService } from "../services/command.service";
import { TemplateMiddleware } from "../middlewares/create/template.middleware";

export class CreateCommand extends BaseCommand {
  constructor(private readonly withCommand: boolean) {
    super();
  }

  register(command: Command): void {
    if (this.withCommand) {
      command = command.command("create").alias("c").alias("new").alias("init");
    }
    command
      .description("Generate Halsp application")
      .argument("[name]", "Aapplication name")
      .option(
        "-f, --force",
        "Force create application, delete existing files. ",
        false
      )
      .option("--override", "Override existing files. ", false)
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
      .option(
        "-t, --template [url]",
        "Generate a project from a remote template"
      )
      .option("-b, --branch <branch>", "The name of template repository branch")
      .option("--path <path>", "Path to template files")
      .setCommonOptions()
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup("create", { name }, command)
            .add(CheckNameMiddleware)
            .add(async (ctx) => {
              const commandService = await ctx.getService(CommandService);
              if (commandService.getOptionVlaue("template")) {
                return TemplateMiddleware;
              } else {
                return ScaffoldMiddleware;
              }
            })
            .add(InitGitMiddleware)
            .add(InstallMiddleware)
            .add(RunMiddleware)
            .run();
        }
      );
  }
}
