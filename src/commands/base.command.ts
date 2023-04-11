import { Command } from "commander";

export abstract class BaseCommand {
  abstract register(command: Command): void;
}

declare module "commander" {
  interface Command {
    setCommonOptions(): Command;
  }
}

Command.prototype.setCommonOptions = function () {
  this.option("--skipCheckUpdate", "Skip to check update version");

  return this;
};
