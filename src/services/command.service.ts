import { Context, isUndefined } from "@halsp/core";
import { Inject } from "@halsp/inject";

export class CommandService {
  @Inject
  private readonly ctx!: Context;

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
}
