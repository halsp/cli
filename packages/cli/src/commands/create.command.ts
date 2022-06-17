import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { CreateMiddleware } from "../middlewares/create-middleware";
import { BaseCommand } from "./base.command";
import path from "path";

export class CreateCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("create <name>")
      .alias("c")
      .description("Generate sfa application")
      .option(
        "-f, --force",
        "Force create application, delete existing files. ",
        false
      )
      .option("-sg, --skip-git", "Skip git repository initialization. ", false)
      .option("-e, --env [env]", "The environment to run application")
      .option("--skip-env [env]", "No running environment", false)
      .option(
        "-pm, --package-manager [package-manager]",
        "Specify package manager. (npm/yarn/pnpm/cnpm)"
      )
      .option(
        "-cv, --cli-version [version]",
        "Version of @sfajs/cli",
        getCliVersion()
      )
      .option(
        "-ps, --plugins [plugins]",
        "Plugins to add (e.g. view,router,inject)"
      )
      .option("-ps, --skip-plugins", "No plugins will be added")
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup({ name }, command).add(CreateMiddleware).run();
        }
      );
  }
}

function getCliVersion() {
  const file = path.join(__dirname, "../../package.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cliPkg = require(file);
  return cliPkg.version;
}
