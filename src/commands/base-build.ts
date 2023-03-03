import { Command } from "commander";

declare module "commander" {
  interface Command {
    setBuildOptions(defaultMode: string): Command;
  }
}

Command.prototype.setBuildOptions = function (defaultMode: string) {
  return this.option(
    "-m, --mode <mode>",
    "Run mode (e.g., development,production).",
    defaultMode
  )
    .option(
      "-c, --config <path>",
      "Path to halsp-cli configuration file.",
      "halsp-cli.config.ts"
    )
    .option(
      "-jc, --jsonConfig <json>",
      "Json string of halsp-cli configuration."
    )
    .option(
      "-fc, --funcConfig <function>",
      "Function string to build halsp-cli configuration."
    )
    .option("-tc, --tsconfigPath <path>", "Path to tsconfig.json file.")
    .option("-w, --watch", "Run in watch mode (live-reload).")
    .option("-wa, --watchAssets", "Watch non-ts (e.g., .views) files mode.")
    .option(
      "--assets <assets>",
      "Copy files to dist (e.g. views/**/*||static/**/*)"
    );
};
