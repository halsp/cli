import "@ipare/core";
import "@ipare/inject";
import { HookType, HttpContext, Request, Startup } from "@ipare/core";
import {
  COMMAND_ARGS_METADATA,
  COMMAND_OPTIONS_METADATA,
  COMMAND_TYPE_METADATA,
  HOOK_EXCEPTION,
} from "./constant";
import { ConfigService } from "./services/build.services/config.service";
import { CommandType } from "./configuration";
import { parseInject } from "@ipare/inject";

declare module "@ipare/core" {
  interface HttpContext {
    get command(): CommandType;
    get commandArgs(): Record<string, string>;
    get commandOptions(): Record<string, string | boolean>;
  }
}

export class CliStartup extends Startup {
  constructor(
    args?: Record<string, string>,
    options?: Record<string, string | boolean>
  ) {
    super();

    this[COMMAND_OPTIONS_METADATA] = options ?? {};
    this[COMMAND_ARGS_METADATA] = args ?? {};

    this.use(async (ctx, next) => {
      Object.defineProperty(ctx, "command", {
        configurable: false,
        enumerable: false,
        get: () => {
          return ctx[COMMAND_TYPE_METADATA];
        },
      });

      Object.defineProperty(ctx, "commandArgs", {
        configurable: false,
        enumerable: false,
        get: () => {
          return this[COMMAND_ARGS_METADATA];
        },
      });

      Object.defineProperty(ctx, "commandOptions", {
        configurable: false,
        enumerable: false,
        get: () => {
          return this[COMMAND_OPTIONS_METADATA];
        },
      });

      await next();
    })
      .hook(HookType.Exception, (ctx, md, ex) => {
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
    const res = await super.invoke(new HttpContext(new Request()));
    if (res[HOOK_EXCEPTION]) {
      throw res[HOOK_EXCEPTION];
    }
    return res;
  }
}
