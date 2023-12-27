import { Context } from "@halsp/core";
import path from "path";
import { Inject } from "@halsp/inject";

export class CreateService {
  @Inject
  private readonly ctx!: Context;

  public get name() {
    return this.ctx.commandArgs.name as string;
  }
  public get targetDir() {
    return path.join(process.cwd(), this.name);
  }
}
