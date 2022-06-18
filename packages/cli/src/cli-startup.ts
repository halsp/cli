import "@sfajs/core";
import "@sfajs/inject";
import { HookType, HttpContext, SfaRequest, Startup } from "@sfajs/core";
import {
  COMMAND_ARGS_METADATA,
  COMMAND_OPTIONS_METADATA,
  COMMAND_TYPE_METADATA,
  HOOK_EXCEPTION,
} from "./constant";
import { ConfigService } from "./services/config.service";
import { CommandType } from "./configuration";
import { parseInject } from "@sfajs/inject";

declare module "@sfajs/core" {
  interface HttpContext {
    get command(): CommandType;
    get commandArgs(): Record<string, string>;
    get commandOptions(): Record<string, string | boolean>;
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

Object.defineProperty(HttpContext.prototype, "command", {
  configurable: false,
  enumerable: false,
  get: function () {
    const ctx = this as HttpContext;
    return ctx.startup[COMMAND_TYPE_METADATA];
  },
});

export class CliStartup extends Startup {
  constructor(
    args?: Record<string, string>,
    options?: Record<string, string | boolean>
  ) {
    super();

    this[COMMAND_OPTIONS_METADATA] = options ?? {};
    this[COMMAND_ARGS_METADATA] = args ?? {};

    this.hook(HookType.Exception, (ctx, md, ex) => {
      ctx.res[HOOK_EXCEPTION] = ex;
      return true;
    })
      .useInject()
      .inject(ConfigService, async (ctx) => {
        const result = await parseInject(ctx, new ConfigService());
        await result.init();
        return result;
      });
  }

  async run() {
    const res = await super.invoke(new HttpContext(new SfaRequest()));
    if (res[HOOK_EXCEPTION]) {
      throw res[HOOK_EXCEPTION];
    }
    return res;
  }
}
