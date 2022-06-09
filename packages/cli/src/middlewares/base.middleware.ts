import { Middleware } from "@sfajs/core";
import { CommandType } from "@sfajs/cli-common";

export abstract class BaseMiddlware extends Middleware {
  abstract get command(): CommandType;

  override async invoke() {
    this.ctx["COMMAND_TYPE_METADATA"] = this.command;
  }
}
