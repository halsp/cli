import { CommandType } from "../utils/command-type";
import { BaseMiddlware } from "./base.middleware";

export class TemplateMiddleware extends BaseMiddlware {
  override get command(): CommandType {
    return "template";
  }

  get name() {
    return this.ctx.commandArgs.name;
  }

  get template() {
    return this.ctx.commandArgs.template;
  }

  override async invoke(): Promise<void> {
    await super.invoke();

    console.log("TODO", this.template, this.name);
  }
}
