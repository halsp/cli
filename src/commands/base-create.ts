import { Command } from "commander";

declare module "commander" {
  interface Command {
    setCreateOptions(): Command;
  }
}

Command.prototype.setCreateOptions = function () {
  return this.option(
    "-sg, --skip-git",
    "Skip git repository initialization. ",
    false
  )
    .option("-si, --skip-install", "Skip package installation.", false)
    .option(
      "-p, --package-manager [package-manager]",
      "Specify package manager. (npm/yarn/pnpm/cnpm)",
      "npm"
    );
};
