import * as ts from "typescript";
import { Context } from "@sfajs/pipe";
import { HttpContext } from "@sfajs/core";
import path from "path";
import { Configuration, ConfigEnv } from "../configuration";
import { Inject } from "@sfajs/inject";
import { ReadService } from "./read.service";
import { TsconfigService } from "./tsconfig.service";
import module from "module";
import vm from "vm";

export class ConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly readService!: ReadService;
  @Inject
  private readonly tsconfigService!: TsconfigService;

  #configFileName: string | undefined = undefined;
  get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName = this.ctx.getCommandOption<string>("configName");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        this.#configFileName =
          this.readService.existAny([
            "sfa-cli.config.ts",
            "sfacli.config.ts",
            "sfa-cli.ts",
            "sfacli.ts",
          ]) ?? "";
      }
    }
    return this.#configFileName;
  }

  get configFilePath() {
    if (this.configFileName) {
      return path.resolve(process.cwd(), this.configFileName);
    } else {
      return "";
    }
  }

  #value: Configuration | undefined = undefined;
  get value(): Configuration {
    if (this.#value == undefined) {
      this.#value = this.loadConfig();
    }
    return this.#value;
  }

  public get mode() {
    return this.ctx.getCommandOption<string>("mode") ?? "production";
  }

  private loadConfig(): Configuration {
    let code: string | undefined = undefined;
    if (this.configFilePath) {
      code = this.readService.readTxt(this.configFilePath);
      if (code) {
        const { options } = this.tsconfigService.parsedCommandLine;
        code = ts.transpile(code, options, this.configFilePath);
      }
    }

    if (!code) {
      return {};
    }

    const configOptions: ConfigEnv = {
      mode: this.mode,
      dirname: path.dirname(this.configFilePath),
      command: this.ctx.command,
    };
    const module = this.getModuleFromString(code);
    if (module.default) {
      return module.default(configOptions);
    } else if (module.exports) {
      return module.exports(configOptions);
    } else {
      return {};
    }
  }

  private getModuleFromString(bundle: string): {
    default?: (options: ConfigEnv) => Configuration;
    exports?: (options: ConfigEnv) => Configuration;
  } {
    const m: any = {};
    const wrapper = module.wrap(bundle);
    const script = new vm.Script(wrapper, {
      displayErrors: true,
    });
    const result = script.runInThisContext();
    result.call(m, m, require, m);
    return m;
  }
}
