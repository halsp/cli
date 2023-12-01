import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BaseCommand } from "./base.command";
import { ChdirMiddleware } from "../middlewares/chdir.middleware";
import { AddPluginMiddleware } from "../middlewares/plugin/add-plugin.middleware";

export class PluginCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("plugin")
      .argument("[action]", "add, remove, list")
      .argument("[name]", "The name of plugin")
      .description("CLI Plugins")
      .option(
        "-pm, --packageManager <packageManager>",
        "Specify package manager. (npm/yarn/pnpm/cnpm)",
      )
      .option("--registry <url>", "Override configuration registry")
      .setCommonOptions()
      .action(
        async (
          action: string,
          name: string,
          command: Record<string, boolean | string>,
        ) => {
          await new CliStartup("plugin", { action, name }, command)
            .add(ChdirMiddleware)
            .add(() => {
              switch (action) {
                case "add":
                  return AddPluginMiddleware;
                default:
                  throw new Error("The action is not support: " + action);
              }
            })
            .run();
        },
      );
  }
}
