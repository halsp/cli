import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BaseCommand } from "./base.command";
import { AddPluginMiddleware } from "../middlewares/plugin/add-plugin.middleware";
import { ListPluginMiddleware } from "../middlewares/plugin/list-plugin.middleware";
import { RemovePluginMiddleware } from "../middlewares/plugin/remove-plugin.middleware";
import { UpdatePluginMiddleware } from "../middlewares/plugin/update-plugin.middleware";

export class PluginCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("plugin")
      .argument("<action>", "add, remove, list, update")
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
            .use(async (ctx, next) => {
              if (action != "list" && !name) {
                ctx.logger.error("error: missing required argument 'name'");
                return;
              }
              await next();
            })
            .add(() => {
              switch (action) {
                case "add":
                  return AddPluginMiddleware;
                case "list":
                  return ListPluginMiddleware;
                case "remove":
                  return RemovePluginMiddleware;
                case "update":
                  return UpdatePluginMiddleware;
                default:
                  throw new Error("The action is not support: " + action);
              }
            })
            .run();
        },
      );
  }
}
