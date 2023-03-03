//{ filter
import { Context } from "@halsp/common";
import { AuthorizationFilter } from "@halsp/filter";

export class AuthFilter implements AuthorizationFilter {
  onAuthorization(ctx: Context): boolean | Promise<boolean> {
    ctx.set("user", {
      id: 1,
      email: "hi@hal.wang",
    });

    return true;
    // return false to intercept
  }
}
//}
