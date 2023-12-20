import { Context, isUndefined } from "@halsp/core";
import path from "path";
import type { Configuration, ConfigEnv } from "../../configuration";
import { Inject } from "@halsp/inject";
import { CommandService } from "../command.service";
import { FileService } from "../file.service";
import * as fs from "fs";
import { DepsService } from "../deps.service";
import { pathToFileURL } from "url";
import { TsconfigService } from "./tsconfig.service";
import ts from "typescript";
import {
  createAddExtTransformer,
  createAddShimsTransformer,
} from "../../compiler";

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
        const exts = ["ts", "js", "json", "cjs", "mjs", "cts", "mts"];
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
    if (name.match(/\.c(j|t)s$/)) {
      return false;
    }
    if (name.match(/\.m(j|t)s$/)) {
      return true;
    }

    const pkgPath = this.fileService.findFileFromTree("package.json");
    return !!pkgPath && _require(pkgPath).type == "module";
  }

  private get configEnv(): ConfigEnv {
    return {
      mode: this.mode,
      command: this.ctx.command,
      commandArgs: { ...this.ctx.commandArgs },
      commandOptions: { ...this.ctx.commandOptions },
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
    const isTS = this.configFileName.toLowerCase().match(/.*\.(c|m)?ts$/);
    if (isTS) {
      return this.importTsConfig(configFilePath);
    }

    const isJS = this.configFileName.toLowerCase().match(/.*\.(c|m)?js$/);
    if (isJS) {
      return this.importJsConfig(configFilePath);
    }

    const jsJson = this.configFileName.toLowerCase().endsWith(".json");
    if (jsJson) {
      return _require(configFilePath);
    }

    const txt = await fs.promises.readFile(configFilePath, "utf-8");
    return JSON.parse(txt);
  }

  private async importJsConfig(configFilePath: string) {
    let module: any;
    if (this.isESM) {
      module = await import(pathToFileURL(configFilePath).toString());
    } else {
      module = _require(configFilePath);
    }
    if (typeof module == "function") {
      return module(this.configEnv);
    } else if (module.default) {
      return module.default(this.configEnv);
    } else {
      return {};
    }
  }

  private async importTsConfig(configFilePath: string) {
    const isESM = this.isESM;
    const code = await fs.promises.readFile(configFilePath, "utf-8");
    const { options } = this.tsconfigService.parsedCommandLine;
    const { outputText } = ts.transpileModule(code, {
      compilerOptions: {
        ...options,
        module: isESM ? ts.ModuleKind.ES2022 : ts.ModuleKind.CommonJS,
        target: isESM ? ts.ScriptTarget.ES2022 : ts.ScriptTarget.ES2015,
        moduleResolution: isESM
          ? ts.ModuleResolutionKind.Bundler
          : ts.ModuleResolutionKind.Node16,
      },
      transformers: {
        after: [
          createAddShimsTransformer(isESM),
          isESM ? createAddExtTransformer(".js") : undefined,
        ]
          .filter((item) => !!item)
          .map((item) => item!),
      },
      fileName: this.configFileName,
    });

    const tmpFileName =
      this.configFileName + ".temp." + (this.isESM ? "mjs" : "cjs");
    const tmpFile = path.join(path.dirname(configFilePath), tmpFileName);
    await fs.promises.writeFile(tmpFile, outputText);
    try {
      return await this.importJsConfig(tmpFile);
    } finally {
      await fs.promises.rm(tmpFile, {
        force: true,
      });
    }
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
