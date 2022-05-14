import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { TemplateMiddleware } from "../middlewares/template.middleware";
import { BaseCommand } from "./base.command";

export class TemplateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("template [options] <template> <name>")
      .alias("t")
      .description("Generate a project from a remote template")
      .action(
        async (
          template: string,
          name: string,
          command: Record<string, boolean | string>
        ) => {
          await new CliStartup(
            {
              template,
              name,
            },
            command
          )
            .add(TemplateMiddleware)
            .run();
        }
      );
  }
}
