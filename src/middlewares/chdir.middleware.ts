import { Middleware } from "@halsp/core";
import path from "path";

export class ChdirMiddleware extends Middleware {
  async invoke() {
    if (!this.app) {
      return await this.next();
    }

    console.log("cwd1", process.cwd());
    const cwd = process.cwd();
    process.chdir(path.resolve(this.app));
    console.log("cwd2", process.cwd());
    try {
      await this.next();
    } finally {
      console.log("cwd3", process.cwd());
      process.chdir(cwd);
      console.log("cwd4", process.cwd());
    }
  }

  private get app() {
    return this.ctx.commandArgs.app;
  }
}
