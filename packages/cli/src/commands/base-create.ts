import { Command } from "commander";
import path from "path";

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
    .option("--skipEnv", "Skip adding environment files")
    .option(
      "-pm, --packageManager <packageManager>",
      "Specify package manager. (npm/yarn/pnpm/cnpm)"
    )
    .option("--registry <url>", "Override configuration registry")
    .option(
      "-cv, --cliVersion <version>",
      "Version of @ipare/cli",
      getCliVersion()
    )
    .option(
      "-ps, --plugins <plugins>",
      "Plugins to add (e.g. view,router,inject)"
    )
    .option("-sg, --skipGit", "Skip git repository initialization")
    .option("-sp, --skipPlugins", "No plugins will be added")
    .option("-sr, --skipRun", "Skip running after completion")
    .option("--forseInit", "Forse init template");
};

function getCliVersion() {
  const file = path.join(__dirname, "../../package.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cliPkg = require(file);
  return "^" + cliPkg.version;
}
