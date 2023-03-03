import { Command } from "commander";
import { BaseCommand } from "./base.command";
import { CliStartup } from "../cli-startup";
import { ServeMiddleware } from "../middlewares/serve.middleware";

export class ServeCommand extends BaseCommand {
  register(command: Command): void {
    command
      .command("serve")
      .argument("[targetPath]", "Target directory path")
      .description("Serve static web by @halsp/static and @halsp/native")
      .option("-p, --port <port>", "The port on http listens")
      .option("--hostname <hostname>", "The hostname on http listens")
      .option("--hideDir", "Do not list dir")
      .option(
        "--exclude <files>",
        'Exclude files, glob string, separate with space (e.g. "**/*.key secret/*.crt")'
      )
      .option("--prefix <prefix>", "File prefix")
      .option("--encoding <encoding>", "Buffer encoding (e.g. utf8)")
      .action(
        async (
          targetPath: string,
          command: Record<string, boolean | string>
        ) => {
          await new CliStartup("serve", { targetPath }, command)
            .add(ServeMiddleware)
            .run();
        }
      );
  }
}
