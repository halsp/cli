import { Command } from "commander";
import path from "path";

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
    .option(
      "-si, --skip-install|--skipInstall",
      "Skip package installation.",
      false
    )
    .option(
      "-p, --package-manager|--packageManager [package-manager]",
      "Specify package manager. (npm/yarn/pnpm/cnpm)",
      "npm"
    )
    .option(
      "-cv, --cli-version|--cliVersion [version]",
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
