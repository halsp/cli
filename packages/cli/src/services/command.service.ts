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
    properties: string[]
  ): T | undefined;
  getOptionVlaue<T extends string | boolean>(property: string): T | undefined;
  getOptionVlaue<T extends string | boolean>(
    properties: string[],
    defaultVal: T
  ): T;
  getOptionVlaue<T extends string | boolean>(
    property: string,
    defaultVal: T
  ): T;
  getOptionVlaue<T extends string | boolean>(
    properties: string[] | string,
    defaultVal?: T
  ): T | undefined {
    if (!Array.isArray(properties)) {
      properties = [properties];
    }
    for (const property of properties) {
      if (!isUndefined(this.ctx.commandOptions[property])) {
        return this.ctx.commandOptions[property] as unknown as T;
      }

      const value = this.getValue(this.configService.value, property);
      if (!isUndefined(value)) {
        return value;
      }
    }

    return defaultVal;
  }

  private getValue<T = any>(obj: any, property: string): T | undefined {
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

    return this.getValue(obj[firstFragment], property.replace(/^.*?\./, ""));
  }
}
