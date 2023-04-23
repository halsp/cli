import { Middleware } from "@halsp/core";
import path from "path";

export class ChdirMiddleware extends Middleware {
  async invoke() {
    if (!this.app) {
      return await this.next();
    }

    const cwd = process.cwd();
    process.chdir(path.resolve(this.app));
    try {
      await this.next();
    } finally {
      process.chdir(cwd);
    }
  }

  private get app() {
    return this.ctx.commandArgs.app;
  }
}
