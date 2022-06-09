import { BaseMiddlware } from "./base.middleware";
import { CommandType } from "@sfajs/cli-common";

export class UpdateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "update";
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    console.log("TODO");
  }
}
