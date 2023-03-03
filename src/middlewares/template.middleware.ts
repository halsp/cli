import { Middleware } from "@halsp/common";

export class TemplateMiddleware extends Middleware {
  get name() {
    return this.ctx.commandArgs.name;
  }

  get template() {
    return this.ctx.commandArgs.template;
  }

  override async invoke(): Promise<void> {
    this.logger.warn("TODO", this.template, this.name);
  }
}
