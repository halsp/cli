import { Command } from "commander";
import { BaseCommand } from "./base.command";

export class UpdateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("update")
      .alias("u")
      .description("Update sfa dependencies.")
      .action(this.invoke.bind(this));
  }

  private async invoke() {
    console.log("TODO");
  }
}
