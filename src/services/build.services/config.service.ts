import { Context, isUndefined } from "@halsp/core";
import path from "path";
import type { Configuration, ConfigEnv } from "../../configuration";
import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";
import { FileService } from "../file.service";
import * as tsNode from "ts-node";
import * as fs from "fs";
import { DepsService } from "../deps.service";
import { createRequire } from "../../utils/shims";
import { pathToFileURL } from "url";
import { TsconfigService } from "./tsconfig.service";

const require = createRequire(import.meta.url);

export class ConfigService {
  @Inject
  private readonly ctx!: Context;
  @Inject
  private readonly fileService!: FileService;
  @Inject
  private readonly commandService!: CommandService;
  @Inject
  private readonly depsService!: DepsService;
  @Inject
  private readonly tsconfigService!: TsconfigService;

  #configFileName: string | undefined = undefined;
  private get configFileName() {
    if (this.#configFileName == undefined) {
      const optionsConfigName =
        this.commandService.getOptionVlaue<string>("config");
      if (optionsConfigName) {
        this.#configFileName = optionsConfigName;
      } else {
        const exts = ["ts", "js", "json", "cjs", "ejs", "cts", "ets"];
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

  private get isESM() {
    const name = this.configFileName.toLowerCase();
    if (name.endsWith(".cjs") || name.endsWith(".cts")) {
      return false;
    }
    if (name.endsWith(".ejs") || name.endsWith(".ets")) {
      return true;
    }

    const pkgName = "package.json";
    let dir = process.cwd();
    let pkgPath = path.join(dir, pkgName);
    while (
      !fs.existsSync(pkgPath) &&
      path.dirname(dir) != dir &&
      dir.startsWith(path.dirname(dir))
    ) {
      dir = path.dirname(dir);
      pkgPath = path.join(dir, pkgName);
    }
    return fs.existsSync(pkgPath) && require(pkgPath).type == "module";
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

    const cliConfigHooks =
      await this.depsService.getInterfaces<
        (config: Configuration, options: ConfigEnv) => Configuration | void
      >("cliConfigHook");
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
    const isTS = this.configFileName.toLowerCase().match(/.*\.(c|e)?ts$/);
    if (isTS) {
      const beforeregisterer = process[tsNode.REGISTER_INSTANCE];
      beforeregisterer && beforeregisterer.enabled(false);

      const registerer = await this.registerTsNode();
      registerer.enabled(true);
      try {
        return this.importConfig(configFilePath);
      } finally {
        registerer.enabled(false);

        if (!!beforeregisterer) {
          beforeregisterer.enabled(true);
          process[tsNode.REGISTER_INSTANCE] = beforeregisterer;
        }
      }
    }

    const isJS = this.configFileName.toLowerCase().match(/.*\.(c|e)?js$/);
    if (isJS) {
      return this.importConfig(configFilePath);
    }

    const jsJson = this.configFileName.toLowerCase().endsWith(".json");
    if (jsJson) {
      return require(configFilePath);
    }

    const txt = await fs.promises.readFile(configFilePath, "utf-8");
    return JSON.parse(txt);
  }

  private async importConfig(configFilePath: string) {
    let module: any;
    if (this.isESM) {
      module = await import(pathToFileURL(configFilePath).toString());
    } else {
      module = require(configFilePath);
    }
    if (typeof module == "function") {
      return module(this.configEnv);
    } else if (module.default) {
      return module.default(this.configEnv);
    } else {
      return {};
    }
  }

  private async registerTsNode() {
    const isESM = this.isESM;
    return tsNode.register({
      compilerOptions: {
        module: isESM ? "ES2022" : "CommonJS",
        target: isESM ? "ES2022" : "ES2015",
      },
      esm: this.isESM,
      moduleTypes: {
        "**": isESM ? "esm" : "cjs",
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
