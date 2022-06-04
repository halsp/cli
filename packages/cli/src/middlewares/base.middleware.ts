import { Middleware } from "@sfajs/core";
import { CommandType } from "../utils/command-type";

export abstract class BaseMiddlware extends Middleware {
  abstract get command(): CommandType;

  override async invoke() {
    this.ctx["COMMAND_TYPE_METADATA"] = this.command;
  }
}
