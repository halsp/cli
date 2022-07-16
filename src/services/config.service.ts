import { Context } from "@ipare/pipe";
import { HttpContext, isUndefined } from "@ipare/core";
import path from "path";
import { Configuration, ConfigEnv } from "../configuration";
import { Inject } from "@ipare/inject";
import { CommandService } from "./command.service";
import { FileService } from "./file.service";
import * as tsNode from "ts-node";
import _ from "lodash";
import { PluginInterfaceService } from "./plugin-interface.service";

export class ConfigService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly pluginInterfaceService!: PluginInterfaceService;

  #configFileName: string | undefined = undefined;
  private get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName =
        this.commandService.getOptionVlaue<string>("configName");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        const exts = ["ts", "js", "json"];
        const names = [
          "ipare-cli.config",
          "iparecli.config",
          "ipare-cli",
          "iparecli",

          "ipare-cli-config",
          "iparecli-config",

          "ipare_cli.config",
          "iparecli_config",
          "ipare_cli_config",
          "ipare_cli",
        ];

        const files: string[] = [];
        names.forEach((name) => {
          exts.forEach((ext) => {
            files.push(`${name}.${ext}`);
          });
        });

        this.#configFileName = this.fileService.existAny(files) ?? "";
      }
    }
    return this.#configFileName;
  }

  private get configEnv(): ConfigEnv {
    return {
      mode: this.mode,
      command: this.ctx.command,
    };
  }

  public get mode() {
    return this.getOptionOrConfigValue<string>("mode", "mode", "production");
  }

  #value: Configuration | undefined = undefined;
  public get value(): Configuration {
    return this.#value ?? {};
  }

  public async init() {
    if (!this.#value) {
      this.#value = await this.loadConfig();
    }
  }

  private async loadConfig(): Promise<Configuration> {
    let config: Configuration = {};

    const cliConfigs = this.pluginInterfaceService.get("cliConfig");
    for (let cliConfig of cliConfigs) {
      if (typeof cliConfig == "function") {
        cliConfig = cliConfig(this.configEnv);
      }
      _.merge(config, cliConfig);
    }

    _.merge(config, await this.getConfig());

    const cliConfigHooks = this.pluginInterfaceService.get("cliConfigHook");
    for (const hook of cliConfigHooks) {
      config = hook(config, this.configEnv) ?? config;
    }

    return config;
  }

  private async getConfig(): Promise<Configuration> {
    const jsonConfig = this.commandService.getOptionVlaue<string>("jsonConfig");
    if (jsonConfig) {
      return JSON.parse(jsonConfig);
    }

    const funcConfig = this.commandService.getOptionVlaue<string>("funcConfig");
    if (funcConfig) {
      return new Function(`return ${funcConfig}`)()(this.configEnv);
    }

    const configFilePath = this.configFileName
      ? path.resolve(process.cwd(), this.configFileName)
      : undefined;
    if (configFilePath) {
      const config = await this.readConfigFile(configFilePath);
      if (config) {
        return config;
      }
    }

    return {};
  }

  private async readConfigFile(
    configFilePath: string
  ): Promise<Configuration | undefined> {
    const jsJson = this.configFileName.toLowerCase().endsWith(".json");
    if (jsJson) {
      return require(configFilePath);
    }

    const isTS = this.configFileName.toLowerCase().endsWith(".ts");
    if (isTS) {
      const registerer = await this.registerTsNode();
      registerer.enabled(true);
      try {
        return this.requireConfig(configFilePath);
      } finally {
        registerer.enabled(false);
      }
    }

    const isJS = this.configFileName.toLowerCase().endsWith(".js");
    if (isJS) {
      return this.requireConfig(configFilePath);
    }
  }

  private async requireConfig(configFilePath: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(configFilePath);
    if (typeof module == "function") {
      return module(this.configEnv);
    } else if (module.default) {
      return module.default(this.configEnv);
    } else {
      return {};
    }
  }

  private async registerTsNode() {
    return tsNode.register({
      compilerOptions: {
        module: "CommonJS",
      },
      moduleTypes: {
        "**": "cjs",
      },
    });
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
