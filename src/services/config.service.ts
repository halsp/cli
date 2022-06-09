import { Context } from "@sfajs/pipe";
import { HttpContext, isUndefined } from "@sfajs/core";
import path from "path";
import { Configuration, ConfigEnv } from "@sfajs/cli-common";
import { Inject } from "@sfajs/inject";
import { CommandService } from "./command.service";
import { FileService } from "./file.service";

export class ConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;

  #configFileName: string | undefined = undefined;
  get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName = this.ctx.getCommandOption<string>("configName");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        this.#configFileName =
          this.fileService.existAny([
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

  public get mode() {
    return this.getOptionOrConfigValue<string>("mode", "mode", "production");
  }

  #value: Configuration | undefined = undefined;
  get value(): Configuration {
    return this.#value ?? {};
  }

  public async init() {
    if (!this.#value) {
      this.#value = await this.loadConfig();
    }
  }

  private async loadConfig(): Promise<Configuration> {
    if (!this.configFilePath) {
      return {};
    }

    const registerer = await this.registerTsNode();
    registerer.enabled(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(this.configFilePath);
      const configOptions: ConfigEnv = {
        mode: this.mode,
        command: this.ctx.command,
      };
      if (typeof module == "function") {
        return module(configOptions);
      } else if (module.default) {
        return module.default(configOptions);
      } else {
        return {};
      }
    } finally {
      registerer.enabled(false);
    }
  }

  private async registerTsNode() {
    try {
      const tsNode = await import("ts-node");
      return tsNode.register({
        compilerOptions: {
          module: "CommonJS",
        },
        moduleTypes: {
          "**": "cjs",
        },
      });
    } catch (e: any) {
      if (e.code === "ERR_MODULE_NOT_FOUND") {
        throw new Error(
          `Jest: 'ts-node' is required for the TypeScript configuration files. Make sure it is installed\nError: ${e.message}`
        );
      }
      throw e;
    }
  }

  getConfigValue<T = any>(paths: string[] | string): T | undefined;
  getConfigValue<T = any>(paths: string[] | string, defaultVal: T): T;
  getConfigValue<T = any>(
    paths: string[] | string,
    defaultVal?: T
  ): T | undefined {
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    for (const property of paths) {
      const value = this.getDeepConfigValue(this.value, property);
      if (!isUndefined(value)) {
        return value;
      }
    }

    return defaultVal;
  }

  private getDeepConfigValue<T = any>(
    obj: any,
    property: string
  ): T | undefined {
    if (!property || !obj) {
      return undefined;
    }

    if (obj[property] != undefined) {
      return obj[property];
    }

    if (!property.includes(".")) {
      return undefined;
    }

    const firstFragment = property.replace(/\..*$/, "");
    if (!obj[firstFragment]) {
      return undefined;
    }

    return this.getDeepConfigValue(
      obj[firstFragment],
      property.replace(/^.*?\./, "")
    );
  }

  getOptionOrConfigValue<T = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string
  ): T | undefined;
  getOptionOrConfigValue<T = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal: T
  ): T;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string
  ): T | U | undefined;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal: T | U
  ): T | U;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal?: T | U
  ): T | U | undefined {
    if (!Array.isArray(optionCommands)) {
      optionCommands = [optionCommands];
    }
    if (!Array.isArray(configPaths)) {
      configPaths = [configPaths];
    }

    const optionValue = this.commandService.getOptionVlaue<T>(optionCommands);
    if (!isUndefined(optionValue)) {
      return optionValue;
    }

    const configValue = this.getConfigValue<U>(configPaths);
    if (!isUndefined(configValue)) {
      return configValue;
    }

    return defaultVal;
  }
}
