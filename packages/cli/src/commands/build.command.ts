import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BuildMiddlware } from "../middlewares/build.middleware";
import { BaseCommand } from "./base.command";

export class BuildCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("build")
      .alias("b")
      .option("-m, --mode", "Run mode (e.g., development,production).")
      .option("-c, --config [path]", "Path to sfa-cli configuration file.")
      .option("-tc, --tsconfig [path]", "Path to tsconfig.json file.")
      .option("-w, --watch", "Run in watch mode (live-reload).")
      .option("-wa, --watchAssets", "Watch non-ts (e.g., .views) files mode.")
      .description("Build sfa application.")
      .action(async (command: Record<string, boolean | string>) => {
        await new CliStartup(undefined, command).add(BuildMiddlware).run();
      });
  }
}
