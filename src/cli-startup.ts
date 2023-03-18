import "@halsp/core";
import "@halsp/inject";
import { Context, Request, Startup } from "@halsp/core";
import { ConfigService } from "./services/build.services/config.service";
import { CommandType } from "./configuration";
import { parseInject } from "@halsp/inject";
import { ChalkService } from "./services/chalk.service";

declare module "@halsp/core" {
  interface Context {
    get command(): CommandType;
    get commandArgs(): Record<string, string>;
    get commandOptions(): Record<string, string | boolean>;
  }
}

export class CliStartup extends Startup {
  constructor(
    mode = "test",
    args: Record<string, string> = {},
    options: Record<string, string | boolean> = {}
  ) {
    super();

    process.env.NODE_ENV = "development";

    this.use(async (ctx, next) => {
      Object.defineProperty(ctx, "command", {
        configurable: false,
        enumerable: false,
        get: () => {
          return mode;
        },
      });

      Object.defineProperty(ctx, "commandArgs", {
        configurable: false,
        enumerable: false,
        get: () => {
          return args;
        },
      });

      Object.defineProperty(ctx, "commandOptions", {
        configurable: false,
        enumerable: false,
        get: () => {
          return options;
        },
      });

      await next();
    })
      .useInject()
      .inject(ConfigService, async (ctx) => {
        const result = await parseInject(ctx, new ConfigService());
        await result.init();
        return result;
      })
      .inject(ChalkService, async (ctx) => {
        const result = await parseInject(ctx, new ChalkService());
        await result.init();
        return result;
      });
  }

  async run() {
    const res = await super.invoke(new Context(new Request()));
    if (res.ctx.errorStack.length) {
      throw res.ctx.errorStack[0];
    }
    return res;
  }
}
