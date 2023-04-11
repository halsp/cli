import { Context } from "@halsp/core";
import path from "path";
import { Ctx } from "@halsp/pipe";

export class CreateService {
  @Ctx
  private readonly ctx!: Context;

  private get name() {
    return this.ctx.commandArgs.name;
  }
  public get targetDir() {
    return path.join(process.cwd(), this.name);
  }
}
