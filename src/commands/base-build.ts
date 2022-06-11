import { Command } from "commander";

declare module "commander" {
  interface Command {
    setBuildOptions(defaultMode: string): Command;
  }
}

Command.prototype.setBuildOptions = function (defaultMode: string) {
  return this.option(
    "-m, --mode [mode]",
    "Run mode (e.g., development,production).",
    defaultMode
  )
    .option(
      "-c, --config [path]",
      "Path to sfa-cli configuration file.",
      "sfa-cli.config.ts"
    )
    .option("-jc, --jsonConfig [json]", "Json string of sfa-cli configuration.")
    .option(
      "-fc, --funcConfig [function]",
      "Function string to build sfa-cli configuration."
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
