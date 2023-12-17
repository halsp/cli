import { Command } from "commander";

declare module "commander" {
  interface Command {
    setBuildOptions(defaultMode: string): Command;
  }
}

Command.prototype.setBuildOptions = function (defaultMode: string) {
  return this.argument("[app]", "Where is the app")
    .option(
      "-m, --mode <mode>",
      "Run mode (e.g., development,production).",
      defaultMode,
    )
    .option("-c, --config <path>", "Path to configuration file.")
    .option("-jc, --jsonConfig <json>", "Json string of Halsp configuration.")
    .option(
      "-fc, --funcConfig <function>",
      "Function string to build Halsp configuration.",
    )
    .option("-tc, --tsconfigPath <path>", "Path to tsconfig.json file.")
    .option("-w, --watch", "Run in watch mode (live-reload).")
    .option("-wa, --watchAssets", "Watch non-ts (e.g., .views) files mode.")
    .option(
      "--assets <assets>",
      "Copy files to dist (e.g. views/**/*||static/**/*)",
    )
    .option(
      "--cacheDir <cacheDir>",
      "Cache dir (default: /node_modules/.halsp)",
    )
    .option(
      "-e, --env <variables...>",
      "Environment Variable, e.g. FOO=BAR,CUSTOM_ENV=abc",
    )
    .option(
      "--skipJsExtTransformer",
      "Remove transformer for adding js extention",
    );
};
