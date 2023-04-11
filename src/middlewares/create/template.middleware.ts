import { Middleware } from "@halsp/core";
import { Inject } from "@halsp/inject";
import { RunnerService } from "../../services/runner.service";

export class TemplateMiddleware extends Middleware {
  @Inject
  private readonly runnerService!: RunnerService;

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
