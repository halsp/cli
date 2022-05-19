import { HttpContext, isUndefined } from "@sfajs/core";
import { Inject } from "@sfajs/inject";
import { Context } from "@sfajs/pipe";
import { ConfigService } from "./config.service";

export class CommandService {
  @Context
  private readonly ctx!: HttpContext;
  @Inject
  private readonly configService!: ConfigService;

  getOptionVlaue<T extends string | boolean>(
    commands: string[] | string
  ): T | undefined;
  getOptionVlaue<T extends string | boolean>(
    commands: string[] | string,
    defaultVal: T
  ): T;
  getOptionVlaue<T extends string | boolean>(
    commands: string[] | string,
    defaultVal?: T
  ): T | undefined {
    if (!Array.isArray(commands)) {
      commands = [commands];
    }
    for (const property of commands) {
      if (!isUndefined(this.ctx.commandOptions[property])) {
        return this.ctx.commandOptions[property] as unknown as T;
      }
    }

    return defaultVal;
  }

  getConfigVlaue<T = any>(paths: string[] | string): T | undefined;
  getConfigVlaue<T = any>(paths: string[] | string, defaultVal: T): T;
  getConfigVlaue<T = any>(
    paths: string[] | string,
    defaultVal?: T
  ): T | undefined {
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    for (const property of paths) {
      const value = this.getConfigValue(this.configService.value, property);
      if (!isUndefined(value)) {
        return value;
      }
    }

    return defaultVal;
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
  getOptionOrConfigValue<T = any>(
    optionCommands: string[] | string,
    configPaths: string[] | string,
    defaultVal?: T
  ): T | undefined {
    if (!Array.isArray(optionCommands)) {
      optionCommands = [optionCommands];
    }
    if (!Array.isArray(configPaths)) {
      configPaths = [configPaths];
    }

    const optionValue = this.getOptionVlaue(optionCommands);
    if (!isUndefined(optionValue)) {
      return optionValue as any;
    }

    const configValue = this.getConfigVlaue(configPaths);
    if (!isUndefined(configValue)) {
      return configValue as any;
    }

    return defaultVal;
  }

  private getConfigValue<T = any>(obj: any, property: string): T | undefined {
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

    return this.getConfigValue(
      obj[firstFragment],
      property.replace(/^.*?\./, "")
    );
  }
}
