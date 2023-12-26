import { Command } from "commander";
import { CliStartup } from "../cli-startup";
import { BaseCommand } from "./base.command";
import { AddAttachMiddleware } from "../middlewares/attach/add-attach.middleware";
import { ListAttachMiddleware } from "../middlewares/attach/list-attach.middleware";
import { RemoveAttachMiddleware } from "../middlewares/attach/remove-attach.middleware";
import { UpdateAttachMiddleware } from "../middlewares/attach/update-attach.middleware";

export class AttachCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("attach")
      .argument("<action>", "add, remove, list, update")
      .argument("[name]", "The name of plugin")
      .description("Attach CLI Plugins")
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
          await new CliStartup("attach", { action, name }, command)
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
                  return AddAttachMiddleware;
                case "list":
                  return ListAttachMiddleware;
                case "remove":
                  return RemoveAttachMiddleware;
                case "update":
                  return UpdateAttachMiddleware;
                default:
                  throw new Error("The action is not support: " + action);
              }
            })
            .run();
        },
      );
  }
}
