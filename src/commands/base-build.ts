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
      "Path to ipare-cli configuration file.",
      "ipare-cli.config.ts"
    )
    .option(
      "-jc, --json-config [json]",
      "Json string of ipare-cli configuration."
    )
    .option(
      "-fc, --func-config [function]",
      "Function string to build ipare-cli configuration."
    )
    .option("-tc, --tsconfigPath [path]", "Path to tsconfig.json file.")
    .option("-w, --watch", "Run in watch mode (live-reload).")
    .option("-wa, --watch-assets", "Watch non-ts (e.g., .views) files mode.");
};
