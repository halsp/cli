import { Context, isUndefined } from "@halsp/core";
import path from "path";
import { Configuration, ConfigEnv } from "../../configuration";
import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";
import { FileService } from "../file.service";
import * as tsNode from "ts-node";
import * as fs from "fs";
import { DepsService } from "../deps.service";

export class ConfigService {
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly depsService!: DepsService;

  #configFileName: string | undefined = undefined;
  private get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName =
        this.commandService.getOptionVlaue<string>("config");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        const exts = ["ts", "js", "json"];
        const names = [".halsprc", "halsp.config"];

        const files: string[] = [];
        names.forEach((name) => {
          exts.forEach((ext) => {
            files.push(`${name}.${ext}`);
          });
          files.push(name);
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
    return this.commandService.getOptionVlaue<string>("mode") as string;
  }

  get cacheDir() {
    const optDir = this.getOptionOrConfigValue<string>(
      "cacheDir",
      "build.cacheDir",
    );
    if (optDir) return optDir;

    return "node_modules/.halsp";
  }

  #value: Configuration | undefined = undefined;
  public get value(): Configuration {
    return this.#value as Configuration;
  }

  public async init() {
    if (!this.#value) {
      this.#value = await this.loadConfig();
    }
  }

  private async loadConfig(): Promise<Configuration> {
    let config = await this.getConfig();

    const cliConfigHooks = this.depsService
      .getInterfaces<
        (config: Configuration, options: ConfigEnv) => Configuration | void
      >("cliConfigHook")
      .map((item) => item.interface);
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
    configFilePath: string,
  ): Promise<Configuration | undefined> {
    const isTS = this.configFileName.toLowerCase().endsWith(".ts");
    if (isTS) {
      if (!!process[tsNode.REGISTER_INSTANCE]) {
        return this.requireConfig(configFilePath);
      } else {
        const registerer = await this.registerTsNode();
        registerer.enabled(true);
        try {
          return this.requireConfig(configFilePath);
        } finally {
          registerer.enabled(false);
        }
      }
    }

    const isJS = this.configFileName.toLowerCase().endsWith(".js");
    if (isJS) {
      return this.requireConfig(configFilePath);
    }

    const jsJson = this.configFileName.toLowerCase().endsWith(".json");
    if (jsJson) {
      return require(configFilePath);
    }

    const txt = await fs.promises.readFile(configFilePath, "utf-8");
    return JSON.parse(txt);
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
    defaultVal?: T,
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
    property: string,
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
      property.replace(/^.*?\./, ""),
    );
  }

  getOptionOrConfigValue<T = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
  ): T | undefined;
  getOptionOrConfigValue<T = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal: T,
  ): T;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
  ): T | U | undefined;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal: T | U,
  ): T | U;
  getOptionOrConfigValue<T extends string | boolean, U = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal?: T | U,
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
