import { Middleware } from "@sfajs/core";

export class TemplateMiddleware extends Middleware {
  get name() {
    return this.ctx.commandArgs.name;
  }

  get template() {
    return this.ctx.commandArgs.template;
  }

  async invoke(): Promise<void> {
    console.log("TODO", this.template, this.name);
  }
}
