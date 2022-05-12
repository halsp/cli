import { Command } from "commander";
import { BaseCommand } from "./base.command";

export class TemplateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("template [options] <template> <name>")
      .alias("t")
      .description("Generate a project from a remote template")
      .action(this.invoke.bind(this));
  }

  async invoke(template: string, name: string) {
    console.log("TODO", template, name);
  }
}
