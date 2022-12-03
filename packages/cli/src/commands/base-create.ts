import { Command } from "commander";

declare module "commander" {
  interface Command {
    setCreateOptions(): Command;
  }
}

Command.prototype.setCreateOptions = function () {
  return this.option(
    "-f, --force",
    "Force create application, delete existing files. ",
    false
  )
    .option(
      "-e, --env <env>",
      "The environment to run application. (lambda/native/azure/micro-tcp/...)"
    )
    .option(
      "-pm, --packageManager <packageManager>",
      "Specify package manager. (npm/yarn/pnpm/cnpm)"
    )
    .option("--registry <url>", "Override configuration registry")
    .option("--debug", "Debug mode")
    .option(
      "-ps, --plugins <plugins>",
      "Plugins to add (e.g. view,router,inject)"
    )
    .option("-se, --skipEnv", "Skip adding environment files")
    .option("-sg, --skipGit", "Skip git repository initialization")
    .option("-sp, --skipPlugins", "No plugins will be added")
    .option("-sr, --skipRun", "Skip running after completion")
    .option("--forseInit", "Forse init template");
};
