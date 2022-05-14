import "@sfajs/core";
import "@sfajs/inject";
import { HttpContext, SfaRequest, Startup } from "@sfajs/core";
import { COMMAND_ARGS_METADATA, COMMAND_OPTIONS_METADATA } from "./constant";
import { TsconfigService } from "./services/tsconfig.service";
import { InjectType } from "@sfajs/inject";
import { ConfigService } from "./services/config.service";
import { ReadService } from "./services/read.service";
import { TsLoaderService } from "./services/ts-loader.service";
import { FileService } from "./services/file.service";

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

    this[COMMAND_ARGS_METADATA] = options ?? {};
    this[COMMAND_OPTIONS_METADATA] = args ?? {};

    this.useInject();
    this.inject(TsconfigService, InjectType.Singleton);
    this.inject(ConfigService, InjectType.Singleton);
    this.inject(ReadService, InjectType.Singleton);
    this.inject(TsLoaderService, InjectType.Singleton);
    this.inject(FileService, InjectType.Singleton);
  }

  async run() {
    super.invoke(new HttpContext(new SfaRequest()));
  }
}
