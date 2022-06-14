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
    );
};

function getCliVersion() {
  const file = path.join(__dirname, "../../package.json");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cliPkg = require(file);
  return cliPkg.version;
}
