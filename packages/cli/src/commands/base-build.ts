import { Command } from "commander";

declare module "commander" {
  interface Command {
    setBuildOptions(): Command;
  }
}

Command.prototype.setBuildOptions = function () {
  return this.option(
    "-m, --mode [mode]",
    "Run mode (e.g., development,production).",
    "production"
  )
    .option(
      "-c, --config [path]",
      "Path to sfa-cli configuration file.",
      "sfa-cli.config.ts"
    )
    .option(
      "-tc, --tsconfig [path]",
      "Path to tsconfig.json file.",
      "tsconfig.json"
    )
    .option("-w, --watch", "Run in watch mode (live-reload).", false)
    .option(
      "-wa, --watchAssets",
      "Watch non-ts (e.g., .views) files mode.",
      false
    );
};
