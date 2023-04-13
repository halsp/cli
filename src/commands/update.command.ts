import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";
import { UpdateMiddleware } from "../middlewares/update.middleware";
import { BaseCommand } from "./base.command";

export class UpdateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("update")
      .alias("u")
      .description("Update halsp dependencies")
      .argument("[app]", "Where is the app")
      .option("-n, --name <name>", "Specify to update a package")
      .option("-a, --all", "Update all dependencies", false)
      .option(
        "-t, --tag <tag>",
        "Upgrade to tagged packages (latest | beta | rc | next tag)",
        "latest"
      )
      .option(
        "-su, --skipUpgrade",
        "Display version information without upgrading",
        false
      )
      .option("-si, --skipInstall", "Skip installation", false)
      .option(
        "-p, --packageManager <packageManager>",
        "Specify package manager. (npm/yarn/pnpm/cnpm)"
      )
      .option("--registry <url>", "Override configuration registry")
      .setCommonOptions()
      .action(
        async (app: string, command: Record<string, boolean | string>) => {
          await new CliStartup("update", { app }, command)
            .add(ChdirMiddleware)
            .add(UpdateMiddleware)
            .run();
        }
      );
  }
}
