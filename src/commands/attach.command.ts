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
      .argument("[name...]", "The name of plugin")
      .description("Attach CLI Plugins")
      .option(
        "-pm, --packageManager <packageManager>",
        "Specify package manager. (npm/yarn/pnpm/cnpm)",
      )
      .option("--registry <url>", "Override configuration registry")
      .option("-ls, --list", "List plugins")
      .option("-rm, --remove", "Remove the plugin")
      .option("-up, --update", "Update the plugin")
      .setCommonOptions()
      .action(
        async (name: string, command: Record<string, boolean | string>) => {
          await new CliStartup("attach", { name }, command)
            .use(async (ctx, next) => {
              if (!command.list && !name) {
                ctx.logger.error("error: missing required argument 'name'");
                return;
              }
              await next();
            })
            .add(() => {
              if (command.list) {
                return ListAttachMiddleware;
              } else if (command.update) {
                return UpdateAttachMiddleware;
              } else if (command.remove) {
                return RemoveAttachMiddleware;
              } else {
                return AddAttachMiddleware;
              }
            })
            .run();
        },
      );
  }
}
