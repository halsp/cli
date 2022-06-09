import { HttpContext, isUndefined } from "@sfajs/core";
import { Context } from "@sfajs/pipe";

export class CommandService {
  @Context
  private readonly ctx!: HttpContext;

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
