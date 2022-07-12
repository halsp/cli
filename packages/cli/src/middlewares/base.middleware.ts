import { Middleware } from "@ipare/core";
import { CommandType } from "../configuration";

export abstract class BaseMiddlware extends Middleware {
  abstract get command(): CommandType;

  override async invoke() {
    this.ctx["COMMAND_TYPE_METADATA"] = this.command;
  }
}
