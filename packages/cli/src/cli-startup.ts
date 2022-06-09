import "@sfajs/core";
import "@sfajs/inject";
import { HookType, HttpContext, SfaRequest, Startup } from "@sfajs/core";
import {
  COMMAND_ARGS_METADATA,
  COMMAND_OPTIONS_METADATA,
  COMMAND_TYPE_METADATA,
  HOOK_EXCEPTION,
} from "./constant";
import { TsconfigService } from "./services/tsconfig.service";
import { ConfigService } from "./services/config.service";
import { TsLoaderService } from "./services/ts-loader.service";
import { FileService } from "./services/file.service";
import { CompilerService } from "./services/compiler.service";
import { WatchCompilerService } from "./services/watch-compiler.service";
import { CommandService } from "./services/command.service";
import { AssetsService } from "./services/assets.service";
import { CreateTemplateService } from "./services/create-template.service";
import { DepsService } from "./services/deps.service";
import { CreateEnvService } from "./services/create-env.service";
import { PluginSelectService } from "./services/plugin-select.service";
import { CommandType } from "@sfajs/cli-common";
import { CreatePackageService } from "./services/create-package.service";
import { PackageManagerService } from "./services/package-manager.service";
import { LoadingService } from "./services/loading.service";
import { CreateConfigService } from "./services/create-config.service";
import { parseInject } from "@sfajs/inject";

declare module "@sfajs/core" {
  interface HttpContext {
    get command(): CommandType;
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

Object.defineProperty(HttpContext.prototype, "command", {
  configurable: false,
  enumerable: false,
  get: function () {
    const ctx = this as HttpContext;
    return ctx.startup[COMMAND_TYPE_METADATA];
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

    this.hook(HookType.Exception, (ctx, md, ex) => {
      ctx.res[HOOK_EXCEPTION] = ex;
      return true;
    })
      .useInject()
      .inject(TsconfigService)
      .inject(ConfigService, async (ctx) => {
        const result = await parseInject(ctx, new ConfigService());
        await result.init();
        return result;
      })
      .inject(TsLoaderService)
      .inject(FileService)
      .inject(CompilerService)
      .inject(WatchCompilerService)
      .inject(CommandService)
      .inject(AssetsService)
      .inject(CreateTemplateService)
      .inject(CreateEnvService)
      .inject(PluginSelectService)
      .inject(DepsService)
      .inject(CreatePackageService)
      .inject(PackageManagerService)
      .inject(LoadingService)
      .inject(CreateConfigService);
  }

  async run() {
    const res = await super.invoke(new HttpContext(new SfaRequest()));
    if (res[HOOK_EXCEPTION]) {
      throw res[HOOK_EXCEPTION];
    }
    return res;
  }
}
