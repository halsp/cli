import { Command } from "commander";
import { BaseCommand } from "./base.command";
import { BuildCommand } from "./build.command";

export class StartCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("start")
      .alias("s")
      .description("Run sfa application.")
      .action(this.invoke.bind(this));
  }

  async invoke() {
    new BuildCommand().invoke();
    console.log("TODO");
  }
}
