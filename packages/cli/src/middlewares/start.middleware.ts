import { Middleware } from "@sfajs/core";
import { SfaHttp } from "@sfajs/http";

export class StartMiddleware extends Middleware {
  async invoke(): Promise<void> {
    new SfaHttp().useHttpJsonBody().use(async (ctx, next) => {
      console.log(ctx.req.method, ctx.req.path);
      await next();
    });
    await this.next();
  }
}
