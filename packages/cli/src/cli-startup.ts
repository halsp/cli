import "@sfajs/core";
import "@sfajs/inject";
import { HttpContext, SfaRequest, Startup } from "@sfajs/core";
import { COMMAND_ARGS_METADATA, COMMAND_OPTIONS_METADATA } from "./constant";
import { TsconfigService } from "./services/tsconfig.service";
import { ConfigService } from "./services/config.service";
import { ReadService } from "./services/read.service";
import { TsLoaderService } from "./services/ts-loader.service";
import { FileService } from "./services/file.service";
import { CompilerService } from "./services/compiler.service";
import { WatchCompilerService } from "./services/watch-compiler.service";
import { CommandService } from "./services/command.service";
import { AssetsService } from "./services/assets.service";

declare module "@sfajs/core" {
  interface HttpContext {
    get commandArgs(): Record<string, string>;
    get commandOptions(): Record<string, string | boolean>;

    getCommandOption<T extends string | boolean>(key: string): T;
  }
}

Object.defineProperty(HttpContext.prototype, "commandArgs", {
  configurable: false,
  enumerable: false,
  get: function () {
    const ctx = this as HttpContext;
    return ctx.startup[COMMAND_ARGS_METADATA];
  },
});

Object.defineProperty(HttpContext.prototype, "commandOptions", {
  configurable: false,
  enumerable: false,
  get: function () {
    const ctx = this as HttpContext;
    return ctx.startup[COMMAND_OPTIONS_METADATA];
  },
});

HttpContext.prototype.getCommandOption = function <T extends string | boolean>(
  key: string
): T {
  return this.commandOptions[key] as T;
};

export class CliStartup extends Startup {
  constructor(
    args?: Record<string, string>,
    options?: Record<string, string | boolean>
  ) {
    super();

    this[COMMAND_OPTIONS_METADATA] = options ?? {};
    this[COMMAND_ARGS_METADATA] = args ?? {};

    this.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        console.error(err);
      }
    });

    this.useInject()
      .inject(TsconfigService)
      .inject(ConfigService)
      .inject(ReadService)
      .inject(TsLoaderService)
      .inject(FileService)
      .inject(CompilerService)
      .inject(WatchCompilerService)
      .inject(CommandService)
      .inject(AssetsService);
  }

  async run() {
    return super.invoke(new HttpContext(new SfaRequest()));
  }
}
