import { CommandType } from "../utils/command-type";
import { BaseMiddlware } from "./base.middleware";

export class UpdateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "update";
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    console.log("TODO");
  }
}
